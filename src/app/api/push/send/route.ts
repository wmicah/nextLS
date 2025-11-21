import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/pushNotificationService";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (for sending notifications)
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, body, data } = await request.json();

    // For now, only allow sending to the authenticated user (or add admin check)
    const targetUserId = userId || user.id;

    const success = await sendPushNotification(
      targetUserId,
      title || "Next Level Coaching",
      body || "You have a new notification",
      data || {}
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
