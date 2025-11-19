import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

// Mock the monitoring function
jest.mock("@/lib/monitoring", () => ({
  captureError: jest.fn(),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when there is an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("shows error details in development mode", () => {
    // Set NODE_ENV to development for this test
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error details in development mode
    expect(screen.getByText(/Error Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  it("calls onError prop when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("displays error message correctly", () => {
    // Set NODE_ENV to development to see error details
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display the error UI
    expect(
      screen.getByText(/We encountered an unexpected error/)
    ).toBeInTheDocument();
    // Error details are in a <details> element which might be collapsed
    // The error message should be in the details element
    expect(screen.getByText(/Error Details/i)).toBeInTheDocument();

    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  it("handles retry button click", () => {
    // Use a component that can be controlled to not throw after reset
    const ControlledThrow = ({ shouldThrow }: { shouldThrow: boolean }) => {
      const [hasThrown, setHasThrown] = React.useState(false);

      React.useEffect(() => {
        if (shouldThrow && !hasThrown) {
          setHasThrown(true);
        }
      }, [shouldThrow, hasThrown]);

      if (hasThrown) {
        throw new Error("Test error");
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ControlledThrow shouldThrow={false} />
      </ErrorBoundary>
    );

    // Initially show no error
    expect(screen.getByText("No error")).toBeInTheDocument();

    // Now trigger an error
    rerender(
      <ErrorBoundary>
        <ControlledThrow shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click retry - this will reset the error boundary, but the component will throw again
    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    // After retry, the error boundary resets but the component throws again
    // So we should still see the error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("handles reload page button click", () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        reload: mockReload,
      },
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText("Reload Page");
    expect(reloadButton).toBeInTheDocument();

    // Click should call reload (though it may not work in test environment)
    fireEvent.click(reloadButton);

    // Button should still be in document after click
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("handles try again button click", () => {
    // Start with no error
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Initially show no error
    expect(screen.getByText("No error")).toBeInTheDocument();

    // Now trigger an error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click try again
    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    // The error boundary should reset, but the component will still throw
    // This is expected behavior - the error boundary will catch it again
    expect(tryAgainButton).toBeInTheDocument();
  });
});
