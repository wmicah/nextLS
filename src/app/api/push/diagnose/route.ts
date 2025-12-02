import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { sendPushNotification } from "@/lib/pushNotificationService";

/**
 * Comprehensive push notification diagnostic endpoint
 * GET: Returns full diagnostic information
 * POST: Runs a test notification and returns results
 */
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all diagnostic information
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      checks: {},
      issues: [],
      recommendations: [],
    };

    // Check 1: User exists in database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true },
    });
    diagnostics.checks.userExists = !!dbUser;
    if (!dbUser) {
      diagnostics.issues.push("User not found in database");
      diagnostics.recommendations.push("Contact support - user account issue");
    }

    // Check 2: User settings
    const userSettings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });
    diagnostics.checks.pushNotificationsEnabled = userSettings?.pushNotifications !== false;
    diagnostics.checks.messageNotificationsEnabled = userSettings?.messageNotifications !== false;
    diagnostics.settings = {
      pushNotifications: userSettings?.pushNotifications ?? true,
      messageNotifications: userSettings?.messageNotifications ?? true,
    };
    
    if (userSettings?.pushNotifications === false) {
      diagnostics.issues.push("Push notifications are disabled in user settings");
      diagnostics.recommendations.push("Enable push notifications in Settings → Notifications");
    }
    if (userSettings?.messageNotifications === false) {
      diagnostics.issues.push("Message notifications are disabled in user settings");
      diagnostics.recommendations.push("Enable message notifications in Settings → Notifications");
    }

    // Check 3: Push subscriptions
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
    diagnostics.checks.hasSubscriptions = subscriptions.length > 0;
    diagnostics.subscriptions = {
      count: subscriptions.length,
      details: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 80) + "...",
        userAgent: sub.userAgent?.substring(0, 100),
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        age: Math.floor((Date.now() - sub.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + " days",
      })),
    };
    
    if (subscriptions.length === 0) {
      diagnostics.issues.push("No push subscriptions found");
      diagnostics.recommendations.push("Subscribe to push notifications: Go to Settings → Notifications → Enable Push Notifications");
    }

    // Check 4: VAPID keys configuration
    const hasVapidPublic = !!process.env.NEXT_PUBLIC_VAPID_KEY;
    const hasVapidPrivate = !!process.env.VAPID_PRIVATE_KEY;
    const hasVapidSubject = !!process.env.VAPID_SUBJECT;
    
    diagnostics.checks.vapidKeys = {
      publicKeySet: hasVapidPublic,
      privateKeySet: hasVapidPrivate,
      subjectSet: hasVapidSubject,
      usingDefaults: !hasVapidPublic && !hasVapidPrivate,
    };
    
    if (!hasVapidPublic || !hasVapidPrivate) {
      diagnostics.issues.push("VAPID keys may not be configured (using defaults)");
      diagnostics.recommendations.push("Verify VAPID keys are set in environment variables");
    }

    // Check 5: Overall health
    const allChecksPass = 
      diagnostics.checks.userExists &&
      diagnostics.checks.pushNotificationsEnabled &&
      diagnostics.checks.hasSubscriptions &&
      (hasVapidPublic || hasVapidPrivate); // At least one key set
    
    diagnostics.overall = {
      healthy: allChecksPass,
      canReceiveNotifications: allChecksPass && subscriptions.length > 0,
      issuesCount: diagnostics.issues.length,
    };

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    console.error("Error in push notification diagnostics:", error);
    return NextResponse.json(
      {
        error: "Failed to run diagnostics",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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

    const { action } = await request.json().catch(() => ({}));

    if (action === "test") {
      // Send a test notification
      console.log(`🧪 Test notification requested for user ${user.id}`);
      
      const result = await sendPushNotification(
        user.id,
        "🧪 Test Notification",
        "This is a test push notification. If you received this, push notifications are working correctly!",
        {
          type: "test",
          timestamp: Date.now(),
          test: true,
        }
      );

      return NextResponse.json({
        success: result,
        message: result
          ? "Test notification sent successfully! Check your device for the notification."
          : "Test notification failed. Check the GET endpoint for diagnostic details.",
        timestamp: new Date().toISOString(),
      });
    }

    // Default: return diagnostics
    return await GET(request);
  } catch (error: any) {
    console.error("Error in push notification test:", error);
    return NextResponse.json(
      {
        error: "Failed to test push notifications",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

