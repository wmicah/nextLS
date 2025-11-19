import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Simple test component
function SimpleComponent() {
	return <div>Hello World</div>
}

describe("Simple Test", () => {
	test("renders hello world", () => {
		render(<SimpleComponent />)
		expect(screen.getByText("Hello World")).toBeInTheDocument()
	})

	test("basic math works", () => {
		expect(2 + 2).toBe(4)
	})

	test("strings can be concatenated", () => {
		expect("Hello" + " " + "World").toBe("Hello World")
	})
})
