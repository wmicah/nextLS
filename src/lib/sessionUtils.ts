import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function clearUserSession() {
  try {
    // Clear any cached session data
    if (typeof window !== "undefined") {
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Clear any cached authentication data
      const cookies = document.cookie.split(";");
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (
          name.includes("kinde") ||
          name.includes("session") ||
          name.includes("auth")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      });
    }
  } catch (error) {
    console.error("Error clearing user session:", error);
  }
}

export async function validateSessionIntegrity(
  userId: string
): Promise<boolean> {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Check if the current session matches the expected user
    return user?.id === userId;
  } catch (error) {
    console.error("Error validating session integrity:", error);
    return false;
  }
}

export async function handleSessionConflict() {
  try {
    // Clear all authentication-related data
    await clearUserSession();

    // Redirect to logout to ensure clean state
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/logout";
    }
  } catch (error) {
    console.error("Error handling session conflict:", error);
  }
}



