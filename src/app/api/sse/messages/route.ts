import { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController[]>();

export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Clean up any existing connections for this user first
        const existingConnections = connections.get(userId);
        if (existingConnections) {
          existingConnections.forEach(existingController => {
            try {
              existingController.close();
            } catch (error) {
              // Ignore errors when closing old connections
            }
          });
          connections.delete(userId);
        }

        // Add this connection
        if (!connections.has(userId)) {
          connections.set(userId, []);
        }
        connections.get(userId)!.push(controller);

        // Send initial connection message
        const data = JSON.stringify({
          type: "connection_established",
          data: { message: "SSE connected successfully" },
        });
        controller.enqueue(`data: ${data}\n\n`);

        console.log(`SSE connected for user: ${userId}`);

        // Store controller reference for cleanup
        (controller as any).userId = userId;
      },
      cancel(controller) {
        // Remove this connection when client disconnects
        const userConnections = connections.get(userId);
        if (userConnections) {
          const index = userConnections.indexOf(controller);
          if (index > -1) {
            userConnections.splice(index, 1);
          }
          if (userConnections.length === 0) {
            connections.delete(userId);
          }
        }
        console.log(`SSE disconnected for user: ${userId}`);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("SSE route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Export function to send messages to specific users
export function sendToUser(userId: string, message: any) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const data = JSON.stringify(message);
    userConnections.forEach(controller => {
      try {
        // Check if controller is still open before trying to enqueue
        if (controller.desiredSize !== null) {
          controller.enqueue(`data: ${data}\n\n`);
        }
      } catch (error) {
        // Silently ignore errors for closed controllers
        console.log("SSE controller error (ignored):", error);
      }
    });
  }
}

// Export function to broadcast to all users
export function broadcast(message: any) {
  const data = JSON.stringify(message);
  connections.forEach(userConnections => {
    userConnections.forEach(controller => {
      try {
        // Check if controller is still open before trying to enqueue
        if (controller.desiredSize !== null) {
          controller.enqueue(`data: ${data}\n\n`);
        }
      } catch (error) {
        // Silently ignore errors for closed controllers
        console.log("SSE broadcast error (ignored):", error);
      }
    });
  });
}
