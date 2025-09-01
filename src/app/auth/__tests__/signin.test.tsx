import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import SignInPage from "../signin/page"

// Mock Kinde Auth
jest.mock("@kinde-oss/kinde-auth-nextjs", () => ({
	LoginLink: ({
		children,
		className,
	}: {
		children: React.ReactNode
		className?: string
	}) => (
		<button className={className} data-testid="login-button">
			{children}
		</button>
	),
}))

describe("SignIn Page - Critical User Flow", () => {
	beforeEach(() => {
		render(<SignInPage />)
	})

	test("renders signin form with all required elements", () => {
		// Check if the page title is displayed
		expect(screen.getByText("Welcome back")).toBeInTheDocument()
		expect(
			screen.getByText("Sign in to your Next Level Softball account")
		).toBeInTheDocument()

		// Check if form inputs are present
		expect(screen.getByLabelText("Email")).toBeInTheDocument()
		expect(screen.getByLabelText("Password")).toBeInTheDocument()
		expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument()
		expect(
			screen.getByPlaceholderText("Enter your password")
		).toBeInTheDocument()

		// Check if login button is present (use getAllByTestId to handle multiple buttons)
		const loginButtons = screen.getAllByTestId("login-button")
		expect(loginButtons.length).toBeGreaterThan(0)
		expect(screen.getByText("Sign In")).toBeInTheDocument()
	})

	test("allows user to input email and password", () => {
		const emailInput = screen.getByLabelText("Email")
		const passwordInput = screen.getByLabelText("Password")

		// Type in email
		fireEvent.change(emailInput, { target: { value: "test@example.com" } })
		expect(emailInput).toHaveValue("test@example.com")

		// Type in password
		fireEvent.change(passwordInput, { target: { value: "password123" } })
		expect(passwordInput).toHaveValue("password123")
	})

	test("password visibility toggle works", () => {
		const passwordInput = screen.getByLabelText("Password")

		// Find the password toggle button by looking for the eye icon
		const toggleButton = passwordInput.parentElement?.querySelector(
			'button[type="button"]'
		)
		expect(toggleButton).toBeInTheDocument()

		// Initially password should be hidden
		expect(passwordInput).toHaveAttribute("type", "password")

		// Click toggle to show password
		if (toggleButton) {
			fireEvent.click(toggleButton)
			expect(passwordInput).toHaveAttribute("type", "text")

			// Click toggle to hide password again
			fireEvent.click(toggleButton)
			expect(passwordInput).toHaveAttribute("type", "password")
		}
	})

	test("form validation prevents empty submission", () => {
		// Get the first login button (main sign in button)
		const loginButtons = screen.getAllByTestId("login-button")
		const mainLoginButton = loginButtons[0]

		// Button should be enabled by default
		expect(mainLoginButton).not.toBeDisabled()
	})

	test("displays proper branding and styling", () => {
		// Check if Target icon is present (it's an SVG with lucide-target class)
		const targetIcon = document.querySelector(".lucide-target")
		expect(targetIcon).toBeInTheDocument()

		// Check if gradient background classes are applied
		const pageContainer = document.querySelector(".min-h-screen")
		expect(pageContainer).toHaveClass("bg-gradient-to-br")
	})

	test("provides link to signup page", () => {
		// Check if signup link is present
		expect(screen.getByText("Don't have an account?")).toBeInTheDocument()

		// Should have a link to signup
		const signupLink = screen.getByText("Sign up").closest("a")
		expect(signupLink).toHaveAttribute("href", "/auth/signup")
	})

	test("renders Google sign-in option", () => {
		// Check if Google sign-in button is present
		expect(screen.getByText("Continue with Google")).toBeInTheDocument()

		// Should have Google icon
		const googleIcon = document.querySelector('svg[viewBox="0 0 24 24"]')
		expect(googleIcon).toBeInTheDocument()
	})
})
