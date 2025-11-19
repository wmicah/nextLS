import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("Mobile callback received:", { code, state, error });

    // Create redirect URL
    let redirectUrl = "nextlevelcoaching://auth/callback";

    if (error) {
      const errorDescription =
        searchParams.get("error_description") || "Authentication failed";
      redirectUrl += `?error=${encodeURIComponent(
        error
      )}&error_description=${encodeURIComponent(errorDescription)}`;
    } else if (code && state) {
      redirectUrl += `?code=${encodeURIComponent(
        code
      )}&state=${encodeURIComponent(state)}`;
    }

    // Return HTML that redirects to the mobile app
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to Mobile App</title>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
        </head>
        <body>
          <p>Redirecting to mobile app...</p>
          <script>
            window.location.href = "${redirectUrl}";
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error in mobile callback:", error);
    const errorUrl = "nextlevelcoaching://auth/callback?error=server_error";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta http-equiv="refresh" content="0;url=${errorUrl}">
        </head>
        <body>
          <p>Redirecting to mobile app...</p>
          <script>
            window.location.href = "${errorUrl}";
          </script>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
}
