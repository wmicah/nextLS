import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the redirect URL from query params or default to home
    const searchParams = request.nextUrl.searchParams;
    const postLogoutRedirect =
      searchParams.get("post_logout_redirect_url") || "/";

    // Create a response that redirects to the specified URL (or home) and clears all authentication data
    const redirectUrl = new URL(postLogoutRedirect, request.url);
    const response = NextResponse.redirect(redirectUrl);

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

    // Fallback response that clears everything
    // Try to preserve the redirect URL even on error
    const searchParams = request.nextUrl.searchParams;
    const postLogoutRedirect =
      searchParams.get("post_logout_redirect_url") || "/";
    const redirectUrl = new URL(postLogoutRedirect, request.url);
    const response = NextResponse.redirect(redirectUrl);

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
