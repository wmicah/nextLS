import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_KEY ||
    "BASGj2aqEyH7dB9Y0HgHv0QqioUI2g2slsIevET97GCTYa0R5FZTLZyPJ42n1CctIE5Gwvwev7UYciJ6yqXAS_E",
  process.env.VAPID_PRIVATE_KEY || "GbeggsV9EAnG69R5bKsViLVx5IERUpWr4h7Yjh2x4VQ"
);

export async function POST(request: NextRequest) {
  try {
    const { subscription, payload } = await request.json();

    // In a real implementation, you would:
    // 1. Validate the subscription
    // 2. Get the subscription from your database
    // 3. Send the notification

    const notificationPayload = JSON.stringify({
      title: payload.title || "Next Level Softball",
      body: payload.body || "You have a new notification",
      icon: "/icon-192x192.png",
      badge: "/icon-32x32.png",
      data: payload.data || {},
    });

    await webpush.sendNotification(subscription, notificationPayload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
