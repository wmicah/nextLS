import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

/**
 * Admin middleware for additional route protection
 * This provides an extra layer of security for admin routes
 */
export async function adminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Additional server-side admin check could be added here
    // For now, we rely on the layout.tsx validation

    return NextResponse.next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
