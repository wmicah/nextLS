import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createApiResponse,
  createApiError,
  withApiSecurity,
  withValidation,
  withRateLimit,
  withAuth,
  withApiHandlers,
  withValidationSchema,
} from "../api-utils";

// Test schema
const testSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// Mock handler for testing
const mockHandler = jest
  .fn()
  .mockResolvedValue(NextResponse.json({ message: "Success" }));

describe("API Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limit store
    (globalThis as any).rateLimitStore = new Map();
  });

  describe("createApiResponse", () => {
    it("creates a successful API response", () => {
      const data = { id: 1, name: "Test" };
      const response = createApiResponse(data);

      expect(response).toEqual({
        success: true,
        data,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it("creates a response without data", () => {
      const response = createApiResponse({ message: "Operation completed" });

      expect(response).toEqual({
        success: true,
        data: { message: "Operation completed" },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });
  });

  describe("createApiError", () => {
    it("creates an error response with message", () => {
      const error = createApiError("Something went wrong");

      expect(error).toEqual({
        success: false,
        error: "Something went wrong",
        code: undefined,
        details: undefined,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it("creates an error response with custom code and details", () => {
      const error = createApiError("Bad request", "VALIDATION_ERROR", {
        field: "email",
        value: "invalid",
      });

      expect(error).toEqual({
        success: false,
        error: "Bad request",
        code: "VALIDATION_ERROR",
        details: {
          field: "email",
          value: "invalid",
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });
  });

  describe("withValidation", () => {
    it("validates request data successfully", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: JSON.stringify({ name: "Test", email: "test@example.com" }),
      });

      const validatedHandler = withValidation(testSchema, mockHandler);
      const response = await validatedHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request, {
        name: "Test",
        email: "test@example.com",
      });
    });

    it("returns validation error for invalid data", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }), // Missing email
      });

      const validatedHandler = withValidation(testSchema, mockHandler);
      const response = await validatedHandler(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Validation failed");
      expect(responseData.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("withRateLimit", () => {
    it("allows requests within rate limit", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");
      const rateLimitedHandler = withRateLimit(5, 60000, mockHandler);

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await rateLimitedHandler(request);
        expect(response.status).toBe(200);
      }
    });

    it("blocks requests exceeding rate limit", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");
      const rateLimitedHandler = withRateLimit(2, 60000, mockHandler);

      // First 2 requests should succeed
      await rateLimitedHandler(request);
      await rateLimitedHandler(request);

      // Next request should be blocked
      const blockedResponse = await rateLimitedHandler(request);
      expect(blockedResponse.status).toBe(429);
      const responseData = await blockedResponse.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Rate limit exceeded");
    });
  });

  describe("withAuth", () => {
    it("allows authenticated requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          authorization: "Bearer valid_token_12345",
        },
      });

      const authHandler = withAuth(mockHandler);
      const response = await authHandler(request);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.stringContaining("user_")
      );
    });

    it("blocks unauthenticated requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");

      const authHandler = withAuth(mockHandler);
      const response = await authHandler(request);

      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Unauthorized");
    });
  });

  describe("withApiHandlers", () => {
    it("composes multiple handlers correctly", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: JSON.stringify({ name: "Test", email: "test@example.com" }),
      });

      const composedHandler = withApiHandlers(
        [withValidationSchema(testSchema)],
        async (req: NextRequest, validatedData: any) => {
          return NextResponse.json({ message: "Success", data: validatedData });
        }
      );

      const response = await composedHandler(request, {
        name: "Test",
        email: "test@example.com",
      });
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.message).toBe("Success");
    });

    it("handles validation errors in composed handlers", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }), // Missing email
      });

      const composedHandler = withApiHandlers(
        [withValidationSchema(testSchema)],
        async (req: NextRequest, validatedData: any) => {
          return NextResponse.json({ message: "Success", data: validatedData });
        }
      );

      const response = await composedHandler(request, { name: "Test" });
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Validation failed");
    });
  });
});
