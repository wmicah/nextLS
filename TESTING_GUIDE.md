# Testing Guide

This document explains the testing setup and how to write tests for this project.

## Test Setup

### Framework

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **jsdom**: Browser environment simulation

### Configuration

- Config file: `jest.config.js`
- Setup file: `jest.setup.js` (mocks and global setup)
- Test location: `src/**/__tests__/**/*.test.{ts,tsx}`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Update snapshots
npm run test:update
```

## Test Structure

### Component Tests

Components are tested using React Testing Library:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import Component from "../Component";

describe("Component", () => {
  it("renders correctly", () => {
    render(<Component />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Utility Tests

Pure functions are tested directly:

```typescript
import { utilityFunction } from "../utils";

describe("utilityFunction", () => {
  it("returns expected value", () => {
    expect(utilityFunction("input")).toBe("expected");
  });
});
```

### API Router Tests

tRPC routers are tested by mocking the database:

```typescript
import { router } from "../router";
import { db } from "@/db";

jest.mock("@/db");

describe("router", () => {
  it("handles request correctly", async () => {
    (db.model.findMany as jest.Mock).mockResolvedValue([]);
    // Test router logic
  });
});
```

## Mocking

### Next.js Router

Already mocked in `jest.setup.js`:

```typescript
jest.mock("next/navigation");
```

### tRPC

Mock tRPC hooks in your tests:

```typescript
jest.mock("@/app/_trpc/client", () => ({
  trpc: {
    resource: {
      action: {
        useQuery: jest.fn(() => ({ data: [], isLoading: false })),
        useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false })),
      },
    },
  },
}));
```

### Database

Mock Prisma client:

```typescript
jest.mock("@/db", () => ({
  db: {
    model: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
```

## Testing Best Practices

### 1. Test User Behavior

Focus on what users see and do:

```typescript
// ❌ Bad: Testing implementation
expect(component.state.value).toBe("test");

// ✅ Good: Testing user-visible behavior
expect(screen.getByText("test")).toBeInTheDocument();
```

### 2. Use Accessible Queries

Prefer queries that match how users find elements:

```typescript
// ✅ Good
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText("Email");
screen.getByText("Welcome");

// ❌ Avoid
screen.getByTestId("submit-button");
```

### 3. Test Error States

Don't just test happy paths:

```typescript
it("shows error message on failure", async () => {
  // Mock error
  mockMutation.mockRejectedValue(new Error("Failed"));

  // Trigger action
  fireEvent.click(screen.getByRole("button"));

  // Assert error
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### 4. Test Async Operations

Use `waitFor` for async updates:

```typescript
it("loads data asynchronously", async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument();
  });
});
```

### 5. Clean Up Mocks

Reset mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Coverage Goals

- **Target**: 80% coverage (branches, functions, lines, statements)
- **Current**: Run `npm run test:coverage` to see current coverage
- **Focus Areas**:
  - Critical user flows
  - Business logic
  - Error handling
  - Security functions

## Test Examples

### Example: Form Component

```typescript
describe("AddClientModal", () => {
  it("submits form with valid data", () => {
    const onSubmit = jest.fn();
    render(<AddClientModal onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "John Doe",
    });
  });
});
```

### Example: Validation

```typescript
describe("emailSchema", () => {
  it("validates correct emails", () => {
    expect(() => emailSchema.parse("test@example.com")).not.toThrow();
  });

  it("rejects invalid emails", () => {
    expect(() => emailSchema.parse("invalid")).toThrow();
  });
});
```

### Example: API Router

```typescript
describe("clientsRouter", () => {
  it("returns clients for authenticated coach", async () => {
    (db.user.findFirst as jest.Mock).mockResolvedValue({ role: "COACH" });
    (db.client.findMany as jest.Mock).mockResolvedValue([mockClient]);

    const result = await router.list();
    expect(result).toHaveLength(1);
  });
});
```

## Common Issues

### Issue: "Cannot find module"

**Solution**: Check that the module path is correct and the file exists.

### Issue: "Act warning"

**Solution**: Use `waitFor` or `act` for async updates:

```typescript
await waitFor(() => {
  expect(screen.getByText("Updated")).toBeInTheDocument();
});
```

### Issue: "Mock not working"

**Solution**: Ensure mocks are set up before the component renders:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Set up mocks
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
