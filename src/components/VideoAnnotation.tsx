"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import {
	Pen,
	Highlighter,
	ArrowRight,
	Circle,
	Type,
	Eraser,
	Undo,
	Redo,
	Save,
} from "lucide-react"

interface VideoAnnotationProps {
	videoRef: React.RefObject<HTMLVideoElement | null>
	onSaveAnnotation: (annotation: any) => void
	currentTool: "pen" | "highlight" | "arrow" | "circle" | "text" | "erase"
	currentColor: string
	currentWidth: number
	paths: any[]
	setPaths: (paths: any[] | ((prevPaths: any[]) => any[])) => void
}

type Tool = "pen" | "highlight" | "arrow" | "circle" | "text" | "erase"
type DrawingPath = {
	tool: Tool
	points: { x: number; y: number }[]
	color: string
	width: number
	timestamp: number
}

export default function VideoAnnotation({
	videoRef,
	onSaveAnnotation,
	currentTool,
	currentColor,
	currentWidth,
	paths,
	setPaths,
}: VideoAnnotationProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null)

	const tools = [
		{ id: "pen", icon: Pen, label: "Pen" },
		{ id: "highlight", icon: Highlighter, label: "Highlight" },
		{ id: "arrow", icon: ArrowRight, label: "Arrow" },
		{ id: "circle", icon: Circle, label: "Circle" },
		{ id: "text", icon: Type, label: "Text" },
		{ id: "erase", icon: Eraser, label: "Erase" },
	]

	const colors = [
		"#ff0000",
		"#00ff00",
		"#0000ff",
		"#ffff00",
		"#ff00ff",
		"#00ffff",
		"#ffffff",
	]

	const drawArrow = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			start: { x: number; y: number },
			end: { x: number; y: number },
			color: string,
			width: number
		) => {
			const headLength = 15
			const angle = Math.atan2(end.y - start.y, end.x - start.x)

			ctx.strokeStyle = color
			ctx.lineWidth = width
			ctx.beginPath()
			ctx.moveTo(start.x, start.y)
			ctx.lineTo(end.x, end.y)
			ctx.stroke()

			ctx.beginPath()
			ctx.moveTo(end.x, end.y)
			ctx.lineTo(
				end.x - headLength * Math.cos(angle - Math.PI / 6),
				end.y - headLength * Math.sin(angle - Math.PI / 6)
			)
			ctx.moveTo(end.x, end.y)
			ctx.lineTo(
				end.x - headLength * Math.cos(angle + Math.PI / 6),
				end.y - headLength * Math.sin(angle + Math.PI / 6)
			)
			ctx.stroke()
		},
		[]
	)

	const drawPaths = useCallback(() => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d")
		if (!canvas || !ctx) return

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		paths.forEach((path) => {
			if (path.points.length < 2) return

			ctx.strokeStyle = path.color
			ctx.lineWidth = path.width
			ctx.lineCap = "round"
			ctx.lineJoin = "round"

			if (path.tool === "pen" || path.tool === "highlight") {
				ctx.beginPath()
				ctx.moveTo(path.points[0].x, path.points[0].y)
				path.points.forEach((point: { x: number; y: number }) => {
					ctx.lineTo(point.x, point.y)
				})
				ctx.stroke()
			} else if (path.tool === "arrow") {
				const start = path.points[0]
				const end = path.points[path.points.length - 1]
				drawArrow(ctx, start, end, path.color, path.width)
			} else if (path.tool === "circle") {
				const start = path.points[0]
				const end = path.points[path.points.length - 1]
				const radius = Math.sqrt(
					Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
				)
				ctx.beginPath()
				ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
				ctx.stroke()
			}
		})
	}, [paths, drawArrow])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		// Set canvas size to match video
		const resizeCanvas = () => {
			if (videoRef.current) {
				const video = videoRef.current
				const rect = video.getBoundingClientRect()
				canvas.width = rect.width
				canvas.height = rect.height
				canvas.style.width = rect.width + "px"
				canvas.style.height = rect.height + "px"
			}
		}

		resizeCanvas()
		window.addEventListener("resize", resizeCanvas)

		// Also resize when video metadata is loaded
		const video = videoRef.current
		if (video) {
			video.addEventListener("loadedmetadata", resizeCanvas)
		}

		return () => {
			window.removeEventListener("resize", resizeCanvas)
			if (video) {
				video.removeEventListener("loadedmetadata", resizeCanvas)
			}
		}
	}, [videoRef])

	useEffect(() => {
		drawPaths()
	}, [paths])

	// Global mouse up listener to stop drawing if mouse button is released outside canvas
	useEffect(() => {
		const handleGlobalMouseUp = () => {
			if (isDrawing && currentPath) {
				handleMouseUp()
			}
		}

		document.addEventListener("mouseup", handleGlobalMouseUp)
		return () => {
			document.removeEventListener("mouseup", handleGlobalMouseUp)
		}
	}, [isDrawing, currentPath])

	// Helper function to calculate distance from a point to a line segment
	const distanceToLine = (
		start: { x: number; y: number },
		end: { x: number; y: number },
		point: { x: number; y: number }
	) => {
		const A = point.x - start.x
		const B = point.y - start.y
		const C = end.x - start.x
		const D = end.y - start.y

		const dot = A * C + B * D
		const lenSq = C * C + D * D
		let param = -1

		if (lenSq !== 0) param = dot / lenSq

		let xx, yy

		if (param < 0) {
			xx = start.x
			yy = start.y
		} else if (param > 1) {
			xx = end.x
			yy = end.y
		} else {
			xx = start.x + param * C
			yy = start.y + param * D
		}

		const dx = point.x - xx
		const dy = point.y - yy

		return Math.sqrt(dx * dx + dy * dy)
	}

	const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return { x: 0, y: 0 }

		const rect = canvas.getBoundingClientRect()
		const scaleX = canvas.width / rect.width
		const scaleY = canvas.height / rect.height

		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		}
	}

	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (currentTool === "text") return

		const pos = getMousePos(e)

		// Handle erase tool
		if (currentTool === "erase") {
			// Find and remove paths that intersect with the click point
			const eraseRadius = currentWidth / 2
			setPaths((prevPaths) =>
				prevPaths.filter((path) => {
					// For arrows and circles, check if the line/shape intersects with erase area
					if (path.tool === "arrow" || path.tool === "circle") {
						const start = path.points[0]
						const end = path.points[path.points.length - 1]

						// Check if start or end point is within erase radius
						const startDistance = Math.sqrt(
							Math.pow(start.x - pos.x, 2) + Math.pow(start.y - pos.y, 2)
						)
						const endDistance = Math.sqrt(
							Math.pow(end.x - pos.x, 2) + Math.pow(end.y - pos.y, 2)
						)

						if (startDistance <= eraseRadius || endDistance <= eraseRadius) {
							return false // Remove this path
						}

						// For arrows, also check if the line intersects with erase area
						if (path.tool === "arrow") {
							const lineDistance = distanceToLine(start, end, pos)
							if (lineDistance <= eraseRadius) {
								return false // Remove this path
							}
						}

						// For circles, check if the circle intersects with erase area
						if (path.tool === "circle") {
							const radius = Math.sqrt(
								Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
							)
							const centerDistance = Math.sqrt(
								Math.pow(start.x - pos.x, 2) + Math.pow(start.y - pos.y, 2)
							)
							// If erase area overlaps with circle
							if (centerDistance <= radius + eraseRadius) {
								return false // Remove this path
							}
						}

						return true // Keep this path
					}

					// For pen and highlight, check if any point in the path is within erase radius
					return !path.points.some((point: { x: number; y: number }) => {
						const distance = Math.sqrt(
							Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
						)
						return distance <= eraseRadius
					})
				})
			)
			return
		}

		const newPath: DrawingPath = {
			tool: currentTool,
			points: [pos],
			color: currentColor,
			width: currentWidth,
			timestamp: videoRef.current?.currentTime || 0,
		}

		setCurrentPath(newPath)
		setIsDrawing(true)
	}

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		// Only draw if mouse button is pressed (buttons === 1 for left mouse button)
		if (!isDrawing || !currentPath || e.buttons !== 1) return

		const pos = getMousePos(e)

		// Handle erase tool
		if (currentTool === "erase") {
			// Find and remove paths that intersect with the current mouse position
			const eraseRadius = currentWidth / 2
			setPaths((prevPaths) =>
				prevPaths.filter((path) => {
					// For arrows and circles, check if the line/shape intersects with erase area
					if (path.tool === "arrow" || path.tool === "circle") {
						const start = path.points[0]
						const end = path.points[path.points.length - 1]

						// Check if start or end point is within erase radius
						const startDistance = Math.sqrt(
							Math.pow(start.x - pos.x, 2) + Math.pow(start.y - pos.y, 2)
						)
						const endDistance = Math.sqrt(
							Math.pow(end.x - pos.x, 2) + Math.pow(end.y - pos.y, 2)
						)

						if (startDistance <= eraseRadius || endDistance <= eraseRadius) {
							return false // Remove this path
						}

						// For arrows, also check if the line intersects with erase area
						if (path.tool === "arrow") {
							const lineDistance = distanceToLine(start, end, pos)
							if (lineDistance <= eraseRadius) {
								return false // Remove this path
							}
						}

						// For circles, check if the circle intersects with erase area
						if (path.tool === "circle") {
							const radius = Math.sqrt(
								Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
							)
							const centerDistance = Math.sqrt(
								Math.pow(start.x - pos.x, 2) + Math.pow(start.y - pos.y, 2)
							)
							// If erase area overlaps with circle
							if (centerDistance <= radius + eraseRadius) {
								return false // Remove this path
							}
						}

						return true // Keep this path
					}

					// For pen and highlight, check if any point in the path is within erase radius
					return !path.points.some((point: { x: number; y: number }) => {
						const distance = Math.sqrt(
							Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
						)
						return distance <= eraseRadius
					})
				})
			)
			return
		}

		const updatedPath = { ...currentPath, points: [...currentPath.points, pos] }
		setCurrentPath(updatedPath)

		// Draw the current path in real-time
		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d")
		if (!canvas || !ctx) return

		// Clear the canvas and redraw all paths
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		drawPaths()

		// Draw the current path in real-time
		if (updatedPath.points.length >= 2) {
			ctx.strokeStyle = updatedPath.color
			ctx.lineWidth = updatedPath.width
			ctx.lineCap = "round"
			ctx.lineJoin = "round"

			if (updatedPath.tool === "pen" || updatedPath.tool === "highlight") {
				// Draw the complete path
				ctx.beginPath()
				ctx.moveTo(updatedPath.points[0].x, updatedPath.points[0].y)
				updatedPath.points.forEach((point) => {
					ctx.lineTo(point.x, point.y)
				})
				ctx.stroke()
			} else if (updatedPath.tool === "arrow") {
				// Draw arrow from start to current position
				const start = updatedPath.points[0]
				const end = pos
				drawArrow(ctx, start, end, updatedPath.color, updatedPath.width)
			} else if (updatedPath.tool === "circle") {
				// Draw circle from start to current position
				const start = updatedPath.points[0]
				const end = pos
				const radius = Math.sqrt(
					Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
				)
				ctx.beginPath()
				ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
				ctx.stroke()
			}
		}
	}

	const handleMouseUp = () => {
		if (!isDrawing || !currentPath) return

		// Only add the path if it has more than 1 point
		if (currentPath.points.length > 1) {
			setPaths((prev) => [...prev, currentPath])
		}
		setCurrentPath(null)
		setIsDrawing(false)
	}

	return (
		<canvas
			ref={canvasRef}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={() => {
				// Only handle mouse leave if we're actually drawing
				if (isDrawing && currentPath) {
					handleMouseUp()
				}
			}}
			className="absolute top-0 left-0 w-full h-full cursor-crosshair"
			style={{ pointerEvents: "auto" }}
		/>
	)
}
