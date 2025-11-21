import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    // Delete the subscription
    await db.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        endpoint: endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

