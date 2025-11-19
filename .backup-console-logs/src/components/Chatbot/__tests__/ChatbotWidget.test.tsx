import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ChatbotWidget from "../ChatbotWidget"
import { ChatbotProvider } from "../ChatbotContext"

// Mock the API call
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe("ChatbotWidget", () => {
	beforeEach(() => {
		mockFetch.mockClear()
	})

	const renderWithProvider = (component: React.ReactElement) => {
		return render(<ChatbotProvider>{component}</ChatbotProvider>)
	}

	it("renders the chat button when closed", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", {
			name: /open chat with ai assistant/i,
		})
		expect(chatButton).toBeInTheDocument()
	})

	it("opens chat window when button is clicked", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", {
			name: /open chat with ai assistant/i,
		})
		fireEvent.click(chatButton)

		expect(screen.getByText("AI Assistant")).toBeInTheDocument()
		expect(
			screen.getByPlaceholderText("Ask me anything...")
		).toBeInTheDocument()
	})

	it("displays welcome message", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", {
			name: /open chat with ai assistant/i,
		})
		fireEvent.click(chatButton)

		expect(
			screen.getByText(/Hi! I'm your Next Level Softball assistant/)
		).toBeInTheDocument()
	})

	it("shows quick actions when chat is first opened", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", {
			name: /open chat with ai assistant/i,
		})
		fireEvent.click(chatButton)

		expect(screen.getByText("Learn More")).toBeInTheDocument()
	})
})
