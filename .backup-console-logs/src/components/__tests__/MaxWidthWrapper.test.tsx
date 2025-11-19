import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import MaxWidthWrapper from "../MaxWidthWrapper"

describe("MaxWidthWrapper", () => {
	test("renders children content", () => {
		const testContent = "Test content inside wrapper"
		render(<MaxWidthWrapper>{testContent}</MaxWidthWrapper>)

		expect(screen.getByText(testContent)).toBeInTheDocument()
	})

	test("renders with custom className", () => {
		const customClass = "custom-class"
		render(
			<MaxWidthWrapper className={customClass}>
				<div>Test content</div>
			</MaxWidthWrapper>
		)

		const wrapper = screen.getByText("Test content").parentElement
		expect(wrapper).toHaveClass(customClass)
	})

	test("renders multiple children", () => {
		render(
			<MaxWidthWrapper>
				<div>First child</div>
				<div>Second child</div>
				<span>Third child</span>
			</MaxWidthWrapper>
		)

		expect(screen.getByText("First child")).toBeInTheDocument()
		expect(screen.getByText("Second child")).toBeInTheDocument()
		expect(screen.getByText("Third child")).toBeInTheDocument()
	})

	test("renders empty children", () => {
		render(
			<MaxWidthWrapper>
				<div />
			</MaxWidthWrapper>
		)

		// Should render without crashing
		const wrapper =
			document.querySelector('[data-testid="max-width-wrapper"]') ||
			document.querySelector(".max-w-screen-xl")
		expect(wrapper).toBeInTheDocument()
	})

	test("renders with complex JSX children", () => {
		const complexChild = (
			<div>
				<h1>Title</h1>
				<p>
					Paragraph with <strong>bold text</strong>
				</p>
				<button>Click me</button>
			</div>
		)

		render(<MaxWidthWrapper>{complexChild}</MaxWidthWrapper>)

		expect(screen.getByText("Title")).toBeInTheDocument()
		expect(screen.getByText("Paragraph with")).toBeInTheDocument()
		expect(screen.getByText("bold text")).toBeInTheDocument()
		expect(screen.getByText("Click me")).toBeInTheDocument()
	})
})
