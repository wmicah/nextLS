import { cn } from "../utils"

describe("Utility Functions", () => {
	describe("cn function", () => {
		test("combines multiple class names", () => {
			const result = cn("class1", "class2", "class3")
			expect(result).toBe("class1 class2 class3")
		})

		test("handles conditional classes", () => {
			const isActive = true
			const isDisabled = false

			const result = cn(
				"base-class",
				isActive && "active-class",
				isDisabled && "disabled-class"
			)

			expect(result).toBe("base-class active-class")
		})

		test("filters out falsy values", () => {
			const result = cn(
				"base-class",
				null,
				undefined,
				false,
				"",
				0,
				"valid-class"
			)

			expect(result).toBe("base-class valid-class")
		})

		test("handles empty input", () => {
			const result = cn()
			expect(result).toBe("")
		})

		test("handles single class", () => {
			const result = cn("single-class")
			expect(result).toBe("single-class")
		})

		test("handles mixed types", () => {
			const result = cn("base", "class1", null, "class2", undefined, "class3")

			expect(result).toBe("base class1 class2 class3")
		})
	})
})
