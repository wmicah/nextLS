import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

// Mock tRPC mutations
const mockCreateClient = jest.fn()
const mockAssignWorkout = jest.fn()

describe("Form Submissions - Critical User Flow", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("Client Creation Form", () => {
		const ClientCreationForm = () => {
			const [formData, setFormData] = React.useState({
				name: "",
				email: "",
				phone: "",
				notes: "",
			})

			const handleSubmit = (e: React.FormEvent) => {
				e.preventDefault()
				mockCreateClient(formData)
			}

			return (
				<form onSubmit={handleSubmit} data-testid="client-form">
					<div>
						<label htmlFor="name">Name</label>
						<input
							id="name"
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div>
						<label htmlFor="email">Email</label>
						<input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							required
						/>
					</div>
					<div>
						<label htmlFor="phone">Phone</label>
						<input
							id="phone"
							type="tel"
							value={formData.phone}
							onChange={(e) =>
								setFormData({ ...formData, phone: e.target.value })
							}
						/>
					</div>
					<div>
						<label htmlFor="notes">Notes</label>
						<textarea
							id="notes"
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
						/>
					</div>
					<button type="submit">Create Client</button>
				</form>
			)
		}

		test("renders client creation form with all fields", () => {
			render(<ClientCreationForm />)

			expect(screen.getByLabelText("Name")).toBeInTheDocument()
			expect(screen.getByLabelText("Email")).toBeInTheDocument()
			expect(screen.getByLabelText("Phone")).toBeInTheDocument()
			expect(screen.getByLabelText("Notes")).toBeInTheDocument()
			expect(screen.getByText("Create Client")).toBeInTheDocument()
		})

		test("allows user to input client information", async () => {
			const user = userEvent.setup()
			render(<ClientCreationForm />)

			const nameInput = screen.getByLabelText("Name")
			const emailInput = screen.getByLabelText("Email")
			const phoneInput = screen.getByLabelText("Phone")
			const notesInput = screen.getByLabelText("Notes")

			await user.type(nameInput, "John Doe")
			await user.type(emailInput, "john@example.com")
			await user.type(phoneInput, "+1234567890")
			await user.type(notesInput, "New client for pitching lessons")

			expect(nameInput).toHaveValue("John Doe")
			expect(emailInput).toHaveValue("john@example.com")
			expect(phoneInput).toHaveValue("+1234567890")
			expect(notesInput).toHaveValue("New client for pitching lessons")
		})

		test("submits client creation form with correct data", async () => {
			const user = userEvent.setup()
			render(<ClientCreationForm />)

			const nameInput = screen.getByLabelText("Name")
			const emailInput = screen.getByLabelText("Email")
			const submitButton = screen.getByText("Create Client")

			await user.type(nameInput, "Jane Smith")
			await user.type(emailInput, "jane@example.com")
			await user.click(submitButton)

			expect(mockCreateClient).toHaveBeenCalledWith({
				name: "Jane Smith",
				email: "jane@example.com",
				phone: "",
				notes: "",
			})
		})

		test("validates required fields", async () => {
			const user = userEvent.setup()
			render(<ClientCreationForm />)

			const submitButton = screen.getByText("Create Client")
			await user.click(submitButton)

			// Form should not submit without required fields
			expect(mockCreateClient).not.toHaveBeenCalled()
		})
	})

	describe("Workout Assignment Form", () => {
		const WorkoutAssignmentForm = () => {
			const [formData, setFormData] = React.useState({
				clientId: "",
				workoutId: "",
				dueDate: "",
				notes: "",
			})

			const handleSubmit = (e: React.FormEvent) => {
				e.preventDefault()
				mockAssignWorkout(formData)
			}

			return (
				<form onSubmit={handleSubmit} data-testid="workout-form">
					<div>
						<label htmlFor="clientId">Client</label>
						<select
							id="clientId"
							value={formData.clientId}
							onChange={(e) =>
								setFormData({ ...formData, clientId: e.target.value })
							}
							required
						>
							<option value="">Select a client</option>
							<option value="client-1">John Doe</option>
							<option value="client-2">Jane Smith</option>
						</select>
					</div>
					<div>
						<label htmlFor="workoutId">Workout</label>
						<select
							id="workoutId"
							value={formData.workoutId}
							onChange={(e) =>
								setFormData({ ...formData, workoutId: e.target.value })
							}
							required
						>
							<option value="">Select a workout</option>
							<option value="workout-1">Pitching Fundamentals</option>
							<option value="workout-2">Speed Training</option>
						</select>
					</div>
					<div>
						<label htmlFor="dueDate">Due Date</label>
						<input
							id="dueDate"
							type="date"
							value={formData.dueDate}
							onChange={(e) =>
								setFormData({ ...formData, dueDate: e.target.value })
							}
							required
						/>
					</div>
					<div>
						<label htmlFor="notes">Notes</label>
						<textarea
							id="notes"
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
						/>
					</div>
					<button type="submit">Assign Workout</button>
				</form>
			)
		}

		test("renders workout assignment form with all fields", () => {
			render(<WorkoutAssignmentForm />)

			expect(screen.getByLabelText("Client")).toBeInTheDocument()
			expect(screen.getByLabelText("Workout")).toBeInTheDocument()
			expect(screen.getByLabelText("Due Date")).toBeInTheDocument()
			expect(screen.getByLabelText("Notes")).toBeInTheDocument()
			expect(screen.getByText("Assign Workout")).toBeInTheDocument()
		})

		test("allows user to select client and workout", async () => {
			const user = userEvent.setup()
			render(<WorkoutAssignmentForm />)

			const clientSelect = screen.getByLabelText("Client")
			const workoutSelect = screen.getByLabelText("Workout")

			await user.selectOptions(clientSelect, "client-1")
			await user.selectOptions(workoutSelect, "workout-1")

			expect(clientSelect).toHaveValue("client-1")
			expect(workoutSelect).toHaveValue("workout-1")
		})

		test("submits workout assignment with correct data", async () => {
			const user = userEvent.setup()
			render(<WorkoutAssignmentForm />)

			const clientSelect = screen.getByLabelText("Client")
			const workoutSelect = screen.getByLabelText("Workout")
			const dueDateInput = screen.getByLabelText("Due Date")
			const submitButton = screen.getByText("Assign Workout")

			await user.selectOptions(clientSelect, "client-2")
			await user.selectOptions(workoutSelect, "workout-2")
			await user.type(dueDateInput, "2024-02-15")
			await user.click(submitButton)

			expect(mockAssignWorkout).toHaveBeenCalledWith({
				clientId: "client-2",
				workoutId: "workout-2",
				dueDate: "2024-02-15",
				notes: "",
			})
		})

		test("validates required fields in workout assignment", async () => {
			const user = userEvent.setup()
			render(<WorkoutAssignmentForm />)

			const submitButton = screen.getByText("Assign Workout")
			await user.click(submitButton)

			// Form should not submit without required fields
			expect(mockAssignWorkout).not.toHaveBeenCalled()
		})
	})
})
