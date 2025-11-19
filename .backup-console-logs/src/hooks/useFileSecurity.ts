"use client";

import { useState, useCallback } from "react";
import {
  validateFileSecurity,
  validateFileContent,
  type SecurityValidationResult,
} from "@/lib/file-security";

interface UseFileSecurityOptions {
  uploadType:
    | "profilePicture"
    | "video"
    | "audio"
    | "document"
    | "messageAttachment"
    | "feedbackVideo";
  onSecurityEvent?: (event: {
    type: string;
    message: string;
    severity: string;
    fileName?: string;
  }) => void;
}

export function useFileSecurity({
  uploadType,
  onSecurityEvent,
}: UseFileSecurityOptions) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<
    SecurityValidationResult[]
  >([]);

  const validateFile = useCallback(
    async (file: File): Promise<SecurityValidationResult> => {
      setIsValidating(true);

      try {
        // Basic security validation
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        const validation = validateFileSecurity(fileData, uploadType);

        // Content validation (async)
        if (validation.isValid) {
          const contentValid = await validateFileContent(file);
          if (!contentValid) {
            validation.isValid = false;
            validation.errors.push("File content does not match its type");
            validation.riskLevel = "high";
          }
        }

        // Update state
        setValidationResults(prev => [validation, ...prev.slice(0, 9)]); // Keep last 10

        // Trigger security event if needed
        if (
          onSecurityEvent &&
          (!validation.isValid || validation.warnings.length > 0)
        ) {
          onSecurityEvent({
            type: validation.isValid
              ? "validation_warning"
              : "validation_failed",
            message: validation.isValid
              ? `Security warnings: ${validation.warnings.join(", ")}`
              : `Security validation failed: ${validation.errors.join(", ")}`,
            severity: validation.riskLevel,
            fileName: file.name,
          });
        }

        return validation;
      } catch (error) {
        console.error("File validation error:", error);
        const errorResult: SecurityValidationResult = {
          isValid: false,
          errors: ["File validation failed due to an error"],
          warnings: [],
          sanitizedFileName: file.name,
          riskLevel: "high",
        };

        if (onSecurityEvent) {
          onSecurityEvent({
            type: "validation_error",
            message: "File validation failed due to an error",
            severity: "high",
            fileName: file.name,
          });
        }

        return errorResult;
      } finally {
        setIsValidating(false);
      }
    },
    [uploadType, onSecurityEvent]
  );

  const validateFiles = useCallback(
    async (files: FileList | File[]): Promise<SecurityValidationResult[]> => {
      const fileArray = Array.from(files);
      const results: SecurityValidationResult[] = [];

      for (const file of fileArray) {
        const result = await validateFile(file);
        results.push(result);
      }

      return results;
    },
    [validateFile]
  );

  const clearResults = useCallback(() => {
    setValidationResults([]);
  }, []);

  const getOverallStatus = useCallback(() => {
    if (validationResults.length === 0) return "none";

    const hasErrors = validationResults.some(r => !r.isValid);
    const hasWarnings = validationResults.some(r => r.warnings.length > 0);

    if (hasErrors) return "error";
    if (hasWarnings) return "warning";
    return "success";
  }, [validationResults]);

  return {
    validateFile,
    validateFiles,
    clearResults,
    isValidating,
    validationResults,
    getOverallStatus,
  };
}
