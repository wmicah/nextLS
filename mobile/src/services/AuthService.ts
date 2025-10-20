import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { KINDE_CONFIG } from "../config/kinde";

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Update auth state
  private setAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState };
    this.notifyListeners();
  }

  // Get current auth state
  getAuthState(): AuthState {
    return this.authState;
  }

  // Sign in with Kinde
  async signIn(): Promise<void> {
    try {
      this.setAuthState({ isLoading: true });

      // Generate a random state parameter for security
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const state = randomBytes.toString();

      // Create the authorization URL
      const authUrl = new URL(`${KINDE_CONFIG.domain}/oauth2/auth`);
      authUrl.searchParams.set("client_id", KINDE_CONFIG.clientId);
      authUrl.searchParams.set("redirect_uri", KINDE_CONFIG.redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("state", state);

      console.log("Auth URL:", authUrl.toString());

      // Open the browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        KINDE_CONFIG.redirectUri,
        {
          showInRecents: true,
        }
      );

      if (result.type === "success" && (result as any).url) {
        const callbackUrl = (result as any).url;
        console.log("Auth callback URL:", callbackUrl);

        try {
          // Parse the authorization code from the URL
          const url = new URL(callbackUrl);
          const code = url.searchParams.get("code");
          const returnedState = url.searchParams.get("state");

          console.log(
            "URL search params:",
            Object.fromEntries(url.searchParams)
          );

          console.log("Extracted code:", code);
          console.log("Expected state:", state);
          console.log("Returned state:", returnedState);

          if (code && returnedState === state) {
            // Exchange the code for tokens
            await this.exchangeCodeForTokens(code);
          } else {
            console.error("State mismatch or missing code");
            console.error("Expected state:", state);
            console.error("Returned state:", returnedState);
            console.error("Code:", code);
            throw new Error("Invalid authorization response");
          }
        } catch (urlError) {
          console.error("Error parsing callback URL:", urlError);
          console.error("Callback URL:", callbackUrl);
          throw new Error("Failed to parse authorization response");
        }
      } else {
        console.error("Auth failed or cancelled");
        console.error("Result type:", result.type);
        console.error("Result URL:", (result as any).url);
        throw new Error("Authentication was cancelled or failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      throw error;
    }
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string): Promise<void> {
    try {
      const tokenResponse = await fetch(`${KINDE_CONFIG.domain}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: KINDE_CONFIG.clientId,
          code: code,
          redirect_uri: KINDE_CONFIG.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for tokens");
      }

      const tokens = await tokenResponse.json();

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);

      this.setAuthState({
        isAuthenticated: true,
        user: userInfo,
        isLoading: false,
      });
    } catch (error) {
      console.error("Token exchange error:", error);
      throw error;
    }
  }

  // Get user information from Kinde
  private async getUserInfo(accessToken: string): Promise<User> {
    const response = await fetch(`${KINDE_CONFIG.domain}/oauth2/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const userInfo = await response.json();

    return {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      role: userInfo.role || "CLIENT", // Default role
    };
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Clear local state
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });

      // Optional: Call Kinde logout endpoint
      // You can implement this if you want to invalidate the session on Kinde's side
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user;
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
