import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { sendPushNotification } from "@/lib/pushNotificationService";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id },
    });

    // Get user settings
    const userSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    // Check if service worker is registered (client-side only, but we can check subscription endpoint)
    const subscriptionInfo = subscriptions.map(sub => ({
      id: sub.id,
      endpoint: sub.endpoint.substring(0, 50) + "...",
      userAgent: sub.userAgent,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    return NextResponse.json({
      userId: user.id,
      subscriptions: subscriptions.length,
      subscriptionDetails: subscriptionInfo,
      settings: {
        pushNotifications: userSettings?.pushNotifications ?? true,
        messageNotifications: userSettings?.messageNotifications ?? true,
      },
      diagnostics: {
        hasSubscriptions: subscriptions.length > 0,
        pushEnabled: userSettings?.pushNotifications !== false,
        messageEnabled: userSettings?.messageNotifications !== false,
        allGood: subscriptions.length > 0 && 
                 userSettings?.pushNotifications !== false && 
                 userSettings?.messageNotifications !== false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to get debug info",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "test") {
      // Send a test notification
      const result = await sendPushNotification(
        user.id,
        "Test Notification",
        "This is a test push notification. If you received this, push notifications are working!",
        {
          type: "test",
          timestamp: Date.now(),
        }
      );

      return NextResponse.json({
        success: result,
        message: result
          ? "Test notification sent successfully! Check your device."
          : "Test notification failed. Check server logs for details.",
      });
    }

    if (action === "check") {
      // Just return diagnostic info
      return await GET(request);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to perform action",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

