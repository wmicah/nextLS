import { NextRequest, NextResponse } from "next/server";
import { handleLogout } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Get the logout handler from Kinde
    const logoutHandler = await handleLogout();

    // Create a response that clears all authentication data
    const response = await logoutHandler(request);

    // Add additional headers to clear any cached data
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Clear any session-related cookies
    response.cookies.delete("kinde_session");
    response.cookies.delete("kinde_access_token");
    response.cookies.delete("kinde_refresh_token");
    response.cookies.delete("kinde_id_token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Fallback response that clears everything
    const response = NextResponse.redirect(new URL("/", request.url));

    // Clear all authentication cookies
    response.cookies.delete("kinde_session");
    response.cookies.delete("kinde_access_token");
    response.cookies.delete("kinde_refresh_token");
    response.cookies.delete("kinde_id_token");

    return response;
  }
}
