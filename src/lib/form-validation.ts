/**
 * Form Validation Utilities
 *
 * Provides reusable validation functions and error handling for forms
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== "";
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty if not required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  phone: (message = "Please enter a valid phone number"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty if not required
      // Accepts formats: (123) 456-7890, 123-456-7890, 1234567890
      const phoneRegex = /^[\d\s\-()]+$/;
      const digitsOnly = value.replace(/\D/g, "");
      return phoneRegex.test(value) && digitsOnly.length >= 10;
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => !value || value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => !value || value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  pattern: (regex: RegExp, message = "Invalid format"): ValidationRule => ({
    validate: (value: string) => !value || regex.test(value),
    message,
  }),

  url: (message = "Please enter a valid URL"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  match: (
    matchValue: any,
    message = "Values do not match"
  ): ValidationRule => ({
    validate: (value: any) => value === matchValue,
    message,
  }),

  custom: (
    validator: (value: any) => boolean,
    message: string
  ): ValidationRule => ({
    validate: validator,
    message,
  }),
};

/**
 * Validate a single field against multiple rules
 */
export function validateField(
  value: any,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

/**
 * Validate multiple fields
 */
export function validateForm(
  fields: Record<string, FieldValidation>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, field] of Object.entries(fields)) {
    const error = validateField(field.value, field.rules);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: Record<string, string>
): string[] {
  return Object.entries(errors).map(([field, error]) => `${field}: ${error}`);
}

/**
 * Get first validation error
 */
export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}

/**
 * Common form field validations
 */
export const commonValidations = {
  email: [validationRules.required(), validationRules.email()],

  password: [
    validationRules.required(),
    validationRules.minLength(8, "Password must be at least 8 characters"),
  ],

  name: [
    validationRules.required(),
    validationRules.minLength(2, "Name must be at least 2 characters"),
    validationRules.maxLength(100, "Name must be no more than 100 characters"),
  ],

  phone: [validationRules.phone()],

  url: [validationRules.url()],

  positiveNumber: [
    validationRules.required(),
    validationRules.min(0, "Must be a positive number"),
  ],

  duration: [
    validationRules.required(),
    validationRules.min(1, "Duration must be at least 1 minute"),
    validationRules.max(480, "Duration cannot exceed 8 hours"),
  ],

  date: [
    validationRules.required("Please select a date"),
    validationRules.custom((value: string) => {
      const date = new Date(value);
      return date >= new Date(new Date().setHours(0, 0, 0, 0));
    }, "Date cannot be in the past"),
  ],
};

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Debounce validation for real-time feedback
 */
export function debounceValidation<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
