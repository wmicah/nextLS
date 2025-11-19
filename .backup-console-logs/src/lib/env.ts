import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  KINDE_CLIENT_ID: z.string().min(1),
  KINDE_CLIENT_SECRET: z.string().min(1),
  KINDE_ISSUER_URL: z.string().url(),
  KINDE_SITE_URL: z.string().url(),
  KINDE_LOGOUT_REDIRECT_URL: z.string().url().optional(),
  KINDE_LOGIN_REDIRECT_URL: z.string().url().optional(),
  KINDE_MANAGEMENT_API_TOKEN: z.string().min(1).optional(), // Optional for now to avoid breaking existing setups

  // JWT
  JWT_SECRET: z.string().min(32),

  // Upload
  UPLOADTHING_SECRET: z.string().min(1),
  UPLOADTHING_APP_ID: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),

  // Stripe (optional - only needed if using Stripe)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Next Level Softball"),

  // Security (NextAuth is optional if using Kinde)
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Optional
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = (error as z.ZodError).issues
        .map((err: z.ZodIssue) => err.path.join("."))
        .join(", ");
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}`
      );
    }
    throw error;
  }
};

// Export validated environment variables
export const env = parseEnv();

// Environment helpers
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Configuration object
export const config = {
  app: {
    name: env.NEXT_PUBLIC_APP_NAME,
    url: env.NEXT_PUBLIC_APP_URL,
    environment: env.NODE_ENV,
  },
  auth: {
    kinde: {
      clientId: env.KINDE_CLIENT_ID,
      clientSecret: env.KINDE_CLIENT_SECRET,
      issuerUrl: env.KINDE_ISSUER_URL,
      siteUrl: env.KINDE_SITE_URL,
      logoutRedirectUrl:
        env.KINDE_LOGOUT_REDIRECT_URL || `${env.NEXT_PUBLIC_APP_URL}/`,
      loginRedirectUrl:
        env.KINDE_LOGIN_REDIRECT_URL || `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      managementApiToken: env.KINDE_MANAGEMENT_API_TOKEN,
    },
    jwt: {
      secret: env.JWT_SECRET,
    },
    nextauth: {
      secret: env.NEXTAUTH_SECRET,
      url: env.NEXTAUTH_URL,
    },
  },
  database: {
    url: env.DATABASE_URL,
  },
  upload: {
    uploadthing: {
      secret: env.UPLOADTHING_SECRET,
      appId: env.UPLOADTHING_APP_ID,
    },
  },
  email: {
    resend: {
      apiKey: env.RESEND_API_KEY,
    },
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  analytics: {
    id: env.NEXT_PUBLIC_ANALYTICS_ID,
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  },
} as const;

// Type exports
export type Config = typeof config;
export type Env = typeof env;
