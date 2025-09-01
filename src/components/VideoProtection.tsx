"use client"

import { useEffect } from "react"

export default function VideoProtection() {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable common keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault()
        return false
      }
    }

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeydown)
    document.addEventListener("selectstart", handleSelectStart)

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeydown)
      document.removeEventListener("selectstart", handleSelectStart)
    }
  }, [])

  return null
}
