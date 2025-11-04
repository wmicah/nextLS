import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Construct Kinde registration URL
    // Format: https://{issuer}/auth/cx/_:nav&m:register&psid:{client_id}&state:{state}
    const issuerUrl =
      process.env.KINDE_ISSUER_URL ||
      process.env.NEXT_PUBLIC_KINDE_ISSUER_URL ||
      "https://nextlevelsoftball.kinde.com";
    const clientId =
      process.env.KINDE_CLIENT_ID || process.env.NEXT_PUBLIC_KINDE_CLIENT_ID;
    const siteUrl =
      process.env.KINDE_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    if (!clientId) {
      return NextResponse.json(
        { error: "Kinde client ID not configured" },
        { status: 500 }
      );
    }

    // Construct the registration URL
    // Kinde uses this format: /auth/cx/_:nav&m:register&psid:{client_id}
    const registerUrl = `${issuerUrl}/auth/cx/_:nav&m:register&psid:${clientId}&state:signup`;

    return NextResponse.json({ registerUrl });
  } catch (error) {
    console.error("Error getting Kinde register URL:", error);
    return NextResponse.json(
      { error: "Failed to get registration URL" },
      { status: 500 }
    );
  }
}
