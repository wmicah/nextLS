/**
 * Kinde Authentication Configuration
 * Configure session settings and authentication behavior
 */

export const kindeConfig = {
  // Session configuration
  session: {
    // Enable remember me functionality
    rememberMe: true,

    // Session duration settings (in seconds)
    defaultSessionDuration: 24 * 60 * 60, // 24 hours
    rememberMeDuration: 30 * 24 * 60 * 60, // 30 days

    // Auto-refresh tokens
    autoRefresh: true,

    // Refresh token before expiry (in seconds)
    refreshBeforeExpiry: 5 * 60, // 5 minutes
  },

  // Authentication behavior
  auth: {
    // Redirect after login
    postLoginRedirect: "/dashboard",

    // Redirect after logout
    postLogoutRedirect: "/",

    // Enable social logins (optional)
    socialLogins: {
      google: true,
      github: false,
    },
  },

  // Security settings
  security: {
    // Require email verification
    requireEmailVerification: true,

    // Password requirements
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  },
};

// Helper function to get session duration
export function getSessionDuration(rememberMe: boolean = false): number {
  return rememberMe
    ? kindeConfig.session.rememberMeDuration
    : kindeConfig.session.defaultSessionDuration;
}

// Helper function to check if remember me is enabled
export function isRememberMeEnabled(): boolean {
  return kindeConfig.session.rememberMe;
}
