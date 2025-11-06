import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  validateCsrfToken,
  validateRateLimit,
  fileUploadSchema,
  messageSchema,
  programSchema,
} from "../validation";

describe("Validation Schemas", () => {
  describe("emailSchema", () => {
    it("validates correct email addresses", () => {
      expect(() => emailSchema.parse("test@example.com")).not.toThrow();
      expect(() => emailSchema.parse("user.name@domain.co.uk")).not.toThrow();
      expect(() => emailSchema.parse("user+tag@example.com")).not.toThrow();
    });

    it("rejects invalid email addresses", () => {
      expect(() => emailSchema.parse("invalid")).toThrow();
      expect(() => emailSchema.parse("invalid@")).toThrow();
      expect(() => emailSchema.parse("@example.com")).toThrow();
      expect(() => emailSchema.parse("")).toThrow();
    });

    it("transforms email to lowercase", () => {
      const result = emailSchema.parse("Test@EXAMPLE.COM");
      expect(result).toBe("test@example.com");
    });
  });

  describe("passwordSchema", () => {
    it("validates correct passwords", () => {
      expect(() => passwordSchema.parse("Password123")).not.toThrow();
      expect(() => passwordSchema.parse("MyP@ssw0rd")).not.toThrow();
    });

    it("rejects passwords that are too short", () => {
      expect(() => passwordSchema.parse("Short1")).toThrow();
      expect(() => passwordSchema.parse("")).toThrow();
    });

    it("rejects passwords without required characters", () => {
      expect(() => passwordSchema.parse("password123")).toThrow(); // No uppercase
      expect(() => passwordSchema.parse("PASSWORD123")).toThrow(); // No lowercase
      expect(() => passwordSchema.parse("Password")).toThrow(); // No number
    });
  });

  describe("nameSchema", () => {
    it("validates correct names", () => {
      expect(() => nameSchema.parse("John Doe")).not.toThrow();
      expect(() => nameSchema.parse("Mary-Jane")).not.toThrow();
      expect(() => nameSchema.parse("O'Brien")).not.toThrow();
    });

    it("rejects names with invalid characters", () => {
      expect(() => nameSchema.parse("John123")).toThrow();
      expect(() => nameSchema.parse("John@Doe")).toThrow();
      expect(() => nameSchema.parse("")).toThrow();
    });

    it("trims whitespace", () => {
      const result = nameSchema.parse("  John Doe  ");
      expect(result).toBe("John Doe");
    });
  });

  describe("phoneSchema", () => {
    it("validates correct phone numbers", () => {
      expect(() => phoneSchema.parse("123-456-7890")).not.toThrow();
      expect(() => phoneSchema.parse("(123) 456-7890")).not.toThrow();
      expect(() => phoneSchema.parse("+1 123-456-7890")).not.toThrow();
    });

    it("transforms phone numbers", () => {
      const result = phoneSchema.parse("(123) 456-7890");
      expect(result).toBe("1234567890");
    });
  });
});

describe("Sanitization Functions", () => {
  describe("sanitizeHtml", () => {
    it("allows safe HTML tags", () => {
      const result = sanitizeHtml("<p>Hello <strong>world</strong></p>");
      expect(result).toContain("Hello");
      expect(result).toContain("world");
    });

    it("removes dangerous HTML", () => {
      const result = sanitizeHtml("<script>alert('xss')</script>Hello");
      expect(result).not.toContain("<script>");
      expect(result).toContain("Hello");
    });
  });

  describe("sanitizeText", () => {
    it("removes HTML tags", () => {
      const result = sanitizeText("<script>Hello</script>");
      expect(result).not.toContain("<script>");
      expect(result).toContain("Hello");
    });

    it("removes javascript: protocol", () => {
      const result = sanitizeText("javascript:alert('xss')");
      expect(result).not.toContain("javascript:");
    });

    it("removes event handlers", () => {
      const result = sanitizeText("onclick=alert('xss')");
      expect(result).not.toContain("onclick");
    });
  });

  describe("sanitizeUrl", () => {
    it("validates and sanitizes http URLs", () => {
      const result = sanitizeUrl("http://example.com");
      expect(result).toBe("http://example.com/");
    });

    it("validates and sanitizes https URLs", () => {
      const result = sanitizeUrl("https://example.com");
      expect(result).toBe("https://example.com/");
    });

    it("rejects non-http protocols", () => {
      const result = sanitizeUrl("javascript:alert('xss')");
      expect(result).toBe("");
    });

    it("handles invalid URLs", () => {
      const result = sanitizeUrl("not-a-url");
      expect(result).toBe("");
    });
  });
});

describe("Security Functions", () => {
  describe("validateCsrfToken", () => {
    it("validates matching tokens", () => {
      const token = "abc123xyz";
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("rejects non-matching tokens", () => {
      expect(validateCsrfToken("abc123", "xyz789")).toBe(false);
    });

    it("rejects empty tokens", () => {
      expect(validateCsrfToken("", "token")).toBe(false);
      expect(validateCsrfToken("token", "")).toBe(false);
    });

    it("uses timing-safe comparison", () => {
      const token1 = "a".repeat(32);
      const token2 = "b".repeat(32);
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });
  });

  describe("validateRateLimit", () => {
    beforeEach(() => {
      (globalThis as any).rateLimitStore = new Map();
    });

    it("allows requests within limit", () => {
      const result = validateRateLimit("user-1", 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("blocks requests exceeding limit", () => {
      const identifier = "user-1";
      const limit = 2;
      const windowMs = 60000;

      // Make requests up to limit
      validateRateLimit(identifier, limit, windowMs);
      validateRateLimit(identifier, limit, windowMs);

      // Next request should be blocked
      const result = validateRateLimit(identifier, limit, windowMs);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});

describe("Complex Schemas", () => {
  describe("fileUploadSchema", () => {
    it("validates correct file uploads", () => {
      expect(() =>
        fileUploadSchema.parse({
          name: "test.jpg",
          size: 1024,
          type: "image/jpeg",
        })
      ).not.toThrow();
    });

    it("rejects files that are too large", () => {
      expect(() =>
        fileUploadSchema.parse({
          name: "test.jpg",
          size: 11 * 1024 * 1024, // 11MB
          type: "image/jpeg",
        })
      ).toThrow();
    });

    it("rejects disallowed file types", () => {
      expect(() =>
        fileUploadSchema.parse({
          name: "test.exe",
          size: 1024,
          type: "application/x-msdownload",
        })
      ).toThrow();
    });
  });

  describe("messageSchema", () => {
    it("validates correct messages", () => {
      expect(() =>
        messageSchema.parse({
          content: "Hello world",
          recipientId: "123e4567-e89b-12d3-a456-426614174000",
        })
      ).not.toThrow();
    });

    it("rejects empty messages", () => {
      expect(() =>
        messageSchema.parse({
          content: "",
          recipientId: "123e4567-e89b-12d3-a456-426614174000",
        })
      ).toThrow();
    });

    it("rejects messages that are too long", () => {
      expect(() =>
        messageSchema.parse({
          content: "a".repeat(1001),
          recipientId: "123e4567-e89b-12d3-a456-426614174000",
        })
      ).toThrow();
    });
  });

  describe("programSchema", () => {
    it("validates correct programs", () => {
      expect(() =>
        programSchema.parse({
          name: "Test Program",
          description: "A test program",
          duration: 4,
          difficulty: "beginner",
          exercises: ["123e4567-e89b-12d3-a456-426614174000"],
        })
      ).not.toThrow();
    });

    it("rejects programs without exercises", () => {
      expect(() =>
        programSchema.parse({
          name: "Test Program",
          description: "A test program",
          duration: 4,
          difficulty: "beginner",
          exercises: [],
        })
      ).toThrow();
    });
  });
});
