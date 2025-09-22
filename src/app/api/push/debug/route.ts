import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug: Testing database connection...");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🔍 Debug: User from session:", user?.id);

    if (!user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Test database connection by counting existing subscriptions
    const subscriptionCount = await db.pushSubscription.count({
      where: { userId: user.id },
    });

    console.log(
      "🔍 Debug: Found",
      subscriptionCount,
      "subscriptions for user",
      user.id
    );

    // Also try to find all subscriptions for this user
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: user.id },
    });

    console.log("🔍 Debug: User subscriptions:", subscriptions);

    return NextResponse.json({
      userId: user.id,
      subscriptionCount,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + "...",
        createdAt: sub.createdAt,
      })),
    });
  } catch (error) {
    console.error("🔍 Debug: Error testing database:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
