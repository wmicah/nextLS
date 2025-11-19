import { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(req: NextRequest) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // This route is mainly for authentication
  // The actual WebSocket connection happens in the WebSocket server
  return new Response("WebSocket endpoint ready", { status: 200 });
}
