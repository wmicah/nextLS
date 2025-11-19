import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";

// Configure session handling to prevent conflicts
export const runtime = "nodejs";
export const revalidate = 0;

export const GET = handleAuth();
