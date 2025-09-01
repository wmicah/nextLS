import React, { ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { ThemeProvider } from "@/contexts/ThemeContext"

// Mock the Providers component to avoid tRPC context issues in tests
jest.mock("@/components/Providers", () => {
	return function MockProviders({ children }: { children: React.ReactNode }) {
		return <>{children}</>
	}
})

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return <ThemeProvider>{children}</ThemeProvider>
}

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from "@testing-library/react"

// Override render method
export { customRender as render }

// Common test data
export const mockUser = {
	id: "test-user-id",
	name: "Test User",
	email: "test@example.com",
	role: "CLIENT" as const,
}

export const mockCoach = {
	id: "test-coach-id",
	name: "Test Coach",
	email: "coach@example.com",
	role: "COACH" as const,
}

export const mockClient = {
	id: "test-client-id",
	name: "Test Client",
	email: "client@example.com",
	phone: "+1234567890",
	notes: "Test client notes",
	coachId: "test-coach-id",
	createdAt: new Date(),
	updatedAt: new Date(),
}

// Common test utilities
export const createMockEvent = (type: string, target?: any) => ({
	type,
	target: target || {},
	preventDefault: jest.fn(),
	stopPropagation: jest.fn(),
})

export const waitForElementToBeRemoved = (element: Element | null) => {
	return new Promise<void>((resolve) => {
		if (!element) {
			resolve()
			return
		}

		const observer = new MutationObserver(() => {
			if (!document.contains(element)) {
				observer.disconnect()
				resolve()
			}
		})

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})
	})
}
