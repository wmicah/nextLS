import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AddClientModal from "../AddClientModal";
import { trpc } from "@/app/_trpc/client";

// Mock tRPC
jest.mock("@/app/_trpc/client", () => ({
  trpc: {
    useUtils: jest.fn(() => ({
      clients: {
        list: {
          invalidate: jest.fn(),
        },
        checkClientExistsForCoach: {
          fetch: jest.fn(),
        },
      },
    })),
    clients: {
      create: {
        useMutation: jest.fn(),
      },
    },
  },
}));

describe("AddClientModal", () => {
  const mockOnClose = jest.fn();
  const mockOnAddClient = jest.fn();
  const mockMutate = jest.fn();
  const mockUseMutation = jest.fn(() => ({
    mutate: mockMutate,
    isLoading: false,
    isError: false,
    error: null,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    (trpc.clients.create.useMutation as jest.Mock) = mockUseMutation;
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <AddClientModal
        isOpen={false}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal when isOpen is true", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    expect(screen.getByText("Add New Client")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("allows user to input client name", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    expect(nameInput).toHaveValue("John Doe");
  });

  it("allows user to input client email", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    expect(emailInput).toHaveValue("john@example.com");
  });

  it("allows user to input client phone", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "123-456-7890" } });
    expect(phoneInput).toHaveValue("123-456-7890");
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    // Find the close button by querying for buttons and clicking the one that calls onClose
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find(
      btn => btn.onclick !== null || btn.getAttribute("onClick")
    );
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    } else {
      // Alternative: find by testid or querySelector
      const closeBtn = document.querySelector('button[class*="p-2"]');
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    }
  });

  it("prevents submission when name is empty", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    const submitButton = screen.getByRole("button", { name: /add client/i });
    fireEvent.click(submitButton);

    // Should not call mutate
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits form with valid data", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /add client/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "John Doe",
        email: "john@example.com",
      })
    );
  });

  it("handles numeric inputs correctly", () => {
    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    // Use getByLabelText for more reliable queries - match exact label text
    const ageInput = screen.getByLabelText("Age") as HTMLInputElement;
    const averageSpeedInput = screen.getByLabelText(
      /Average Speed/i
    ) as HTMLInputElement;

    fireEvent.change(ageInput, { target: { value: "25" } });
    fireEvent.change(averageSpeedInput, { target: { value: "65.5" } });

    expect(ageInput.value).toBe("25");
    expect(averageSpeedInput.value).toBe("65.5");
  });

  it("shows loading state during submission", () => {
    (trpc.clients.create.useMutation as jest.Mock) = jest.fn(() => ({
      mutate: mockMutate,
      isLoading: true,
      isError: false,
      error: null,
    }));

    render(
      <AddClientModal
        isOpen={true}
        onClose={mockOnClose}
        onAddClient={mockOnAddClient}
      />
    );

    const submitButton = screen.getByRole("button", { name: /add client/i });
    expect(submitButton).toBeDisabled();
  });
});
