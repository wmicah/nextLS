import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { sendPushNotification } from "@/lib/pushNotificationService";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's push subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get user settings
    const userSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
      select: {
        pushNotifications: true,
      },
    });

    // Send a test notification
    const testResult = await sendPushNotification(
      user.id,
      "Test Notification",
      "This is a test push notification. If you received this, push notifications are working!",
      {
        type: "test",
        timestamp: Date.now(),
      }
    );

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.length,
      subscriptionDetails: subscriptions,
      pushNotificationsEnabled: userSettings?.pushNotifications ?? true,
      testNotificationSent: testResult,
      message: testResult
        ? "Test notification sent successfully!"
        : "Test notification failed. Check console for details.",
    });
  } catch (error: any) {
    console.error("Error testing push notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to test push notifications",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
      select: {
        pushNotifications: true,
      },
    });

    return NextResponse.json({
      subscriptions: subscriptions.length,
      subscriptionDetails: subscriptions,
      pushNotificationsEnabled: userSettings?.pushNotifications ?? true,
      notificationPermission: "Check browser settings",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to get subscription status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

