/**
 * FormField Component
 *
 * A reusable form field component with built-in validation, error display,
 * and accessibility features.
 */

import React, { useState, useEffect } from "react";
import { AlertCircle, Check } from "lucide-react";
import { ValidationRule, validateField } from "@/lib/form-validation";

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Field type */
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "date"
    | "time"
    | "datetime-local"
    | "textarea";
  /** Field value */
  value: string | number;
  /** Change handler */
  onChange: (value: string | number) => void;
  /** Validation rules */
  rules?: ValidationRule[];
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  helperText?: string;
  /** Is field required */
  required?: boolean;
  /** Is field disabled */
  disabled?: boolean;
  /** Show validation on blur */
  validateOnBlur?: boolean;
  /** Show validation on change */
  validateOnChange?: boolean;
  /** External error message */
  error?: string;
  /** Show success state */
  showSuccess?: boolean;
  /** Custom class name */
  className?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Min value (for number inputs) */
  min?: number;
  /** Max value (for number inputs) */
  max?: number;
  /** Step value (for number inputs) */
  step?: number;
  /** Rows (for textarea) */
  rows?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  rules = [],
  placeholder,
  helperText,
  required = false,
  disabled = false,
  validateOnBlur = true,
  validateOnChange = false,
  error: externalError,
  showSuccess = false,
  className = "",
  autoComplete,
  min,
  max,
  step,
  rows = 4,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const error = externalError || internalError;
  const showError = error && touched;
  const showSuccessIcon = showSuccess && isValid && touched && !error;

  // Validate field
  const validate = () => {
    if (rules.length === 0) return;

    const errorMessage = validateField(value, rules);
    setInternalError(errorMessage);
    setIsValid(!errorMessage);
  };

  // Handle blur
  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      validate();
    }
  };

  // Handle change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue =
      type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);

    if (validateOnChange && touched) {
      // Validate after state update
      setTimeout(validate, 0);
    }
  };

  // Validate on mount if there's a value
  useEffect(() => {
    if (value && rules.length > 0) {
      validate();
    }
  }, []);

  // Update validation when value changes (for external updates)
  useEffect(() => {
    if (touched && (validateOnChange || validateOnBlur)) {
      validate();
    }
  }, [value]);

  const baseInputClasses = `
    w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${
      showError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : showSuccessIcon
        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
        : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"
    }
  `;

  const inputStyles = {
    backgroundColor: disabled ? "#1f2937" : "#111827",
    color: "#f9fafb",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium"
        style={{ color: "#C3BCC2" }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {type === "textarea" ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            className={baseInputClasses}
            style={inputStyles}
            aria-invalid={showError ? "true" : "false"}
            aria-describedby={
              showError
                ? `${name}-error`
                : helperText
                ? `${name}-helper`
                : undefined
            }
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            min={min}
            max={max}
            step={step}
            className={baseInputClasses}
            style={inputStyles}
            aria-invalid={showError ? "true" : "false"}
            aria-describedby={
              showError
                ? `${name}-error`
                : helperText
                ? `${name}-helper`
                : undefined
            }
          />
        )}

        {/* Success Icon */}
        {showSuccessIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}

        {/* Error Icon */}
        {showError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {showError && (
        <p
          id={`${name}-error`}
          className="text-sm text-red-500 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !showError && (
        <p
          id={`${name}-helper`}
          className="text-sm"
          style={{ color: "#ABA4AA" }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormField;
