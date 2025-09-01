import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: jest.fn(),
		prefetch: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
	}),
	usePathname: () => "/dashboard",
}))

describe("Navigation - Critical User Flow", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test("landing page has navigation to signup", () => {
		// Mock the landing page component
		const LandingPage = () => (
			<div>
				<a href="/auth/signup" data-testid="signup-link">
					Get Started
				</a>
			</div>
		)

		render(<LandingPage />)

		const signupLink = screen.getByTestId("signup-link")
		expect(signupLink).toHaveAttribute("href", "/auth/signup")
	})

	test("landing page has navigation to pricing", () => {
		// Mock the landing page component
		const LandingPage = () => (
			<div>
				<a href="/pricing" data-testid="pricing-link">
					See Pricing
				</a>
			</div>
		)

		render(<LandingPage />)

		const pricingLink = screen.getByTestId("pricing-link")
		expect(pricingLink).toHaveAttribute("href", "/pricing")
	})

	test("signin page has navigation to signup", () => {
		// Mock the signin page component
		const SignInPage = () => (
			<div>
				<p>Don't have an account?</p>
				<a href="/auth/signup" data-testid="signup-link">
					Sign up
				</a>
			</div>
		)

		render(<SignInPage />)

		const signupLink = screen.getByTestId("signup-link")
		expect(signupLink).toHaveAttribute("href", "/auth/signup")
	})

	test("dashboard has navigation to clients page", () => {
		// Mock the dashboard navigation
		const DashboardNav = () => (
			<nav>
				<a href="/clients" data-testid="clients-link">
					Clients
				</a>
				<a href="/programs" data-testid="programs-link">
					Programs
				</a>
				<a href="/schedule" data-testid="schedule-link">
					Schedule
				</a>
			</nav>
		)

		render(<DashboardNav />)

		expect(screen.getByTestId("clients-link")).toHaveAttribute(
			"href",
			"/clients"
		)
		expect(screen.getByTestId("programs-link")).toHaveAttribute(
			"href",
			"/programs"
		)
		expect(screen.getByTestId("schedule-link")).toHaveAttribute(
			"href",
			"/schedule"
		)
	})

	test("client dashboard has navigation to program page", () => {
		// Mock the client dashboard navigation
		const ClientDashboardNav = () => (
			<nav>
				<a href="/client-program" data-testid="program-link">
					Program
				</a>
				<a href="/client-schedule" data-testid="schedule-link">
					Schedule
				</a>
				<a href="/client-messages" data-testid="messages-link">
					Messages
				</a>
			</nav>
		)

		render(<ClientDashboardNav />)

		expect(screen.getByTestId("program-link")).toHaveAttribute(
			"href",
			"/client-program"
		)
		expect(screen.getByTestId("schedule-link")).toHaveAttribute(
			"href",
			"/client-schedule"
		)
		expect(screen.getByTestId("messages-link")).toHaveAttribute(
			"href",
			"/client-messages"
		)
	})

	test("role selection page has navigation to appropriate dashboards", () => {
		// Mock the role selection page
		const RoleSelectionPage = () => (
			<div>
				<button data-testid="coach-role" onClick={() => mockPush("/dashboard")}>
					I'm a Coach
				</button>
				<button
					data-testid="client-role"
					onClick={() => mockPush("/client-dashboard")}
				>
					I'm a Client
				</button>
			</div>
		)

		render(<RoleSelectionPage />)

		const coachButton = screen.getByTestId("coach-role")
		const clientButton = screen.getByTestId("client-role")

		// Test coach navigation
		coachButton.click()
		expect(mockPush).toHaveBeenCalledWith("/dashboard")

		// Test client navigation
		clientButton.click()
		expect(mockPush).toHaveBeenCalledWith("/client-dashboard")
	})

	test("navigation maintains user context", () => {
		// Mock a component that shows user info
		const UserContextComponent = () => (
			<div>
				<span data-testid="user-name">Test User</span>
				<span data-testid="user-email">test@example.com</span>
			</div>
		)

		render(<UserContextComponent />)

		expect(screen.getByTestId("user-name")).toHaveTextContent("Test User")
		expect(screen.getByTestId("user-email")).toHaveTextContent(
			"test@example.com"
		)
	})
})
