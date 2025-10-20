// Kinde Configuration
// Replace these values with your actual Kinde configuration

export const KINDE_CONFIG = {
  // Your Kinde domain
  domain: "https://nextlevelsoftball.kinde.com",

  // Your Kinde client ID
  clientId: "8d0e263fd6854a39925924234f7f6766",

  // Redirect URI - redirect through your domain first
  // Use your live domain for production
  redirectUri: "https://nxlvlcoach.com/auth/mobile-callback",

  // For development, you can use local IP if both devices are on same network:
  // redirectUri: "http://192.168.1.179:3000/auth/mobile-callback",

  // Scopes to request
  scopes: ["openid", "profile", "email"],
};

// Helper function to get the full Kinde domain
export const getKindeDomain = () => KINDE_CONFIG.domain;

// Helper function to get the redirect URI
export const getRedirectUri = () => KINDE_CONFIG.redirectUri;

// Helper function to get the client ID
export const getClientId = () => KINDE_CONFIG.clientId;
