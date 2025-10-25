/**
 * Safe Environment Validation
 * This validates environment variables without breaking existing functionality
 */

interface EnvVar {
  name: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "url" | "email";
  defaultValue?: any;
  validator?: (value: any) => boolean;
}

const ENV_VARS: EnvVar[] = [
  {
    name: "DATABASE_URL",
    required: true,
    type: "string",
    validator: value => value.startsWith("postgresql://"),
  },
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    type: "string",
    validator: value => value.length >= 32,
  },
  {
    name: "KINDE_CLIENT_ID",
    required: true,
    type: "string",
  },
  {
    name: "KINDE_CLIENT_SECRET",
    required: true,
    type: "string",
  },
  {
    name: "KINDE_ISSUER_URL",
    required: true,
    type: "url",
  },
  {
    name: "KINDE_SITE_URL",
    required: true,
    type: "url",
  },
  {
    name: "KINDE_POST_LOGOUT_REDIRECT_URL",
    required: true,
    type: "url",
  },
  {
    name: "KINDE_POST_LOGIN_REDIRECT_URL",
    required: true,
    type: "url",
  },
  {
    name: "RESEND_API_KEY",
    required: false,
    type: "string",
  },
  {
    name: "OPENAI_API_KEY",
    required: false,
    type: "string",
  },
  {
    name: "UPLOADTHING_SECRET",
    required: false,
    type: "string",
  },
  {
    name: "UPLOADTHING_APP_ID",
    required: false,
    type: "string",
  },
  {
    name: "NODE_ENV",
    required: true,
    type: "string",
    defaultValue: "development",
  },
];

class EnvValidator {
  private validationResults: Record<
    string,
    { valid: boolean; error?: string }
  > = {};

  /**
   * Safe environment validation that won't break existing functionality
   */
  validateEnvironment(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const envVar of ENV_VARS) {
      const value = process.env[envVar.name];
      const result = this.validateEnvVar(envVar, value);

      this.validationResults[envVar.name] = result;

      if (!result.valid) {
        if (envVar.required) {
          errors.push(`${envVar.name}: ${result.error}`);
        } else {
          warnings.push(`${envVar.name}: ${result.error} (optional)`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single environment variable
   */
  private validateEnvVar(
    envVar: EnvVar,
    value: string | undefined
  ): { valid: boolean; error?: string } {
    // Handle missing values
    if (!value) {
      if (envVar.required) {
        return { valid: false, error: "Required but not set" };
      } else {
        return { valid: true }; // Optional variables are valid if not set
      }
    }

    // Type validation
    switch (envVar.type) {
      case "string":
        if (typeof value !== "string") {
          return { valid: false, error: "Must be a string" };
        }
        break;
      case "number":
        if (isNaN(Number(value))) {
          return { valid: false, error: "Must be a number" };
        }
        break;
      case "boolean":
        if (!["true", "false", "1", "0"].includes(value.toLowerCase())) {
          return { valid: false, error: "Must be a boolean (true/false)" };
        }
        break;
      case "url":
        try {
          new URL(value);
        } catch {
          return { valid: false, error: "Must be a valid URL" };
        }
        break;
      case "email":
        if (!value.includes("@") || !value.includes(".")) {
          return { valid: false, error: "Must be a valid email" };
        }
        break;
    }

    // Custom validator
    if (envVar.validator && !envVar.validator(value)) {
      return { valid: false, error: "Failed custom validation" };
    }

    return { valid: true };
  }

  /**
   * Get validation results (safe to call)
   */
  getValidationResults(): Record<string, { valid: boolean; error?: string }> {
    return { ...this.validationResults };
  }

  /**
   * Get environment summary (safe to call)
   */
  getEnvironmentSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const envVar of ENV_VARS) {
      const value = process.env[envVar.name];
      const result = this.validationResults[envVar.name];

      summary[envVar.name] = {
        value:
          envVar.name.includes("SECRET") || envVar.name.includes("KEY")
            ? "[HIDDEN]"
            : value,
        required: envVar.required,
        valid: result?.valid ?? false,
        error: result?.error,
      };
    }

    return summary;
  }
}

// Global validator instance
export const envValidator = new EnvValidator();

/**
 * Safe environment check that won't break existing functionality
 */
export function checkEnvironment(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  return envValidator.validateEnvironment();
}

/**
 * Safe environment summary
 */
export function getEnvironmentSummary(): Record<string, any> {
  return envValidator.getEnvironmentSummary();
}

/**
 * Safe environment variable getter with fallback
 */
export function getEnvVar(
  name: string,
  defaultValue?: string
): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Safe environment variable getter with validation
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}
