import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

/**
 * Check push notification status for debugging
 */
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id },
    });

    // Get user settings
    const userSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      userId: user.id,
      subscriptions: {
        count: subscriptions.length,
        details: subscriptions.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + "...",
          createdAt: sub.createdAt,
        })),
      },
      settings: {
        pushNotifications: userSettings?.pushNotifications ?? true,
        messageNotifications: userSettings?.messageNotifications ?? true,
      },
      status: {
        hasSubscriptions: subscriptions.length > 0,
        pushEnabled: userSettings?.pushNotifications !== false,
        messageEnabled: userSettings?.messageNotifications !== false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to check status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

