/**
 * useForm Hook
 *
 * A custom hook for managing form state, validation, and submission
 */

import { useState, useCallback } from "react";
import {
  ValidationRule,
  validateForm,
  FieldValidation,
  ValidationResult,
} from "@/lib/form-validation";

export interface FormConfig<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule[]>>;
  onSubmit: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, isTouched: boolean) => void;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: FormConfig<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<
    Partial<Record<keyof T, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate entire form
  const validate = useCallback((): boolean => {
    const fields: Record<string, FieldValidation> = {};

    for (const [key, rules] of Object.entries(validationRules)) {
      if (rules) {
        fields[key] = {
          value: values[key as keyof T],
          rules: rules as ValidationRule[],
        };
      }
    }

    const result: ValidationResult = validateForm(fields);
    setErrors(result.errors as Partial<Record<keyof T, string>>);
    return result.isValid;
  }, [values, validationRules]);

  // Validate single field
  const validateField = useCallback(
    (field: keyof T): boolean => {
      const rules = validationRules[field];
      if (!rules) return true;

      const fields: Record<string, FieldValidation> = {
        [field as string]: {
          value: values[field],
          rules,
        },
      };

      const result: ValidationResult = validateForm(fields);
      if (result.errors[field as string]) {
        setErrors(prev => ({
          ...prev,
          [field]: result.errors[field as string],
        }));
        return false;
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
    },
    [values, validationRules]
  );

  // Set single value
  const setValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  // Set error for field
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Set touched for field
  const setTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  // Handle change for a field
  const handleChange = useCallback(
    (field: keyof T) => (value: any) => {
      setValue(field, value);

      // Validate if field has been touched
      if (touched[field]) {
        setTimeout(() => validateField(field), 0);
      }
    },
    [setValue, touched, validateField]
  );

  // Handle blur for a field
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched(field, true);
      validateField(field);
    },
    [setTouched, validateField]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);
      setTouchedState(allTouched);

      // Validate form
      const isValid = validate();
      if (!isValid) {
        return;
      }

      // Submit form
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  // Reset form
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
    validateField,
  };
}
