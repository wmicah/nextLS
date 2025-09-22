import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Create a response that redirects to home and clears all authentication data
    const response = NextResponse.redirect(new URL("/", request.url));

    // Add headers to clear any cached data
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Clear all authentication-related cookies
    const cookiesToDelete = [
      "kinde_session",
      "kinde_access_token",
      "kinde_refresh_token",
      "kinde_id_token",
      "kinde_user",
      "kinde_org",
      "kinde_permissions",
      "kinde_roles",
    ];

    cookiesToDelete.forEach(cookieName => {
      response.cookies.delete(cookieName);
      // Also try to delete with different path and domain combinations
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        domain: request.nextUrl.hostname,
      });
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Fallback response that clears everything
    const response = NextResponse.redirect(new URL("/", request.url));

    // Clear all authentication cookies as fallback
    const cookiesToDelete = [
      "kinde_session",
      "kinde_access_token",
      "kinde_refresh_token",
      "kinde_id_token",
      "kinde_user",
      "kinde_org",
      "kinde_permissions",
      "kinde_roles",
    ];

    cookiesToDelete.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });

    return response;
  }
}
