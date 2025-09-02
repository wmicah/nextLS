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

		const chatButton = screen.getByRole("button", { name: /chat/i })
		expect(chatButton).toBeInTheDocument()
	})

	it("opens chat window when button is clicked", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", { name: /chat/i })
		fireEvent.click(chatButton)

		expect(screen.getByText("Softball Assistant")).toBeInTheDocument()
		expect(
			screen.getByPlaceholderText("Type your message...")
		).toBeInTheDocument()
	})

	it("displays welcome message", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", { name: /chat/i })
		fireEvent.click(chatButton)

		expect(
			screen.getByText(/Hi! I'm your Next Level Softball assistant/)
		).toBeInTheDocument()
	})

	it("shows quick actions when chat is first opened", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", { name: /chat/i })
		fireEvent.click(chatButton)

		expect(screen.getByText("Quick Actions")).toBeInTheDocument()
		expect(screen.getByText("Create Program")).toBeInTheDocument()
		expect(screen.getByText("Manage Clients")).toBeInTheDocument()
	})

	it("sends message when user types and presses enter", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ response: "Test response" }),
		} as Response)

		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", { name: /chat/i })
		fireEvent.click(chatButton)

		const input = screen.getByPlaceholderText("Type your message...")
		fireEvent.change(input, { target: { value: "Hello" } })
		fireEvent.keyPress(input, { key: "Enter", code: "Enter" })

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("/api/chatbot", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: "Hello",
					history: expect.any(Array),
					context: expect.any(Object),
				}),
			})
		})
	})

	it("handles API errors gracefully", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"))

		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", { name: /chat/i })
		fireEvent.click(chatButton)

		const input = screen.getByPlaceholderText("Type your message...")
		fireEvent.change(input, { target: { value: "Hello" } })
		fireEvent.keyPress(input, { key: "Enter", code: "Enter" })

		await waitFor(() => {
			expect(
				screen.getByText(/Sorry, I'm having trouble connecting/)
			).toBeInTheDocument()
		})
	})

	it("closes chat window when close button is clicked", () => {
		renderWithProvider(<ChatbotWidget />)

		const chatButton = screen.getByRole("button", { name: /chat/i })
		fireEvent.click(chatButton)

		const closeButton = screen.getByRole("button", { name: /close/i })
		fireEvent.click(closeButton)

		expect(screen.queryByText("Softball Assistant")).not.toBeInTheDocument()
		expect(screen.getByRole("button", { name: /chat/i })).toBeInTheDocument()
	})
})
