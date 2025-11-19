import { NextRequest, NextResponse } from "next/server";

// In-memory store for WebSocket connections
// In production, you'd want to use Redis or another persistent store
const connections = new Map<string, any>();

/**
 * Broadcast a message to a specific user
 * @param userId - The ID of the user to broadcast to
 * @param message - The message to broadcast
 */
export function broadcastToUser(userId: string, message: any) {

  // Find the connection for this user
  const connection = connections.get(userId);

  if (connection) {
    try {
      // Send the message through the WebSocket connection
      connection.send(JSON.stringify(message));

    } catch (error) {

      // Remove the connection if it's no longer valid
      connections.delete(userId);
    }
  } else {

  }
}

/**
 * Broadcast a message to multiple users
 * @param userIds - Array of user IDs to broadcast to
 * @param message - The message to broadcast
 */
export function broadcastToUsers(userIds: string[], message: any) {
  userIds.forEach(userId => broadcastToUser(userId, message));
}

/**
 * Add a WebSocket connection for a user
 * @param userId - The ID of the user
 * @param connection - The WebSocket connection
 */
export function addConnection(userId: string, connection: any) {
  connections.set(userId, connection);

}

/**
 * Remove a WebSocket connection for a user
 * @param userId - The ID of the user
 */
export function removeConnection(userId: string) {
  connections.delete(userId);

}

/**
 * Get the number of active connections
 */
export function getConnectionCount(): number {
  return connections.size;
}

/**
 * Get all active user IDs
 */
export function getActiveUserIds(): string[] {
  return Array.from(connections.keys());
}

// WebSocket upgrade handler
export async function GET(request: NextRequest) {
  // This would typically handle WebSocket upgrades
  // For now, we'll return a simple response indicating the service is available
  return NextResponse.json({
    status: "realtime service available",
    activeConnections: connections.size,
    timestamp: new Date().toISOString(),
  });
}

// Handle WebSocket connections (this would be implemented with proper WebSocket handling)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, message, targetUsers } = body;

    switch (action) {
      case "broadcast":
        if (targetUsers && Array.isArray(targetUsers)) {
          broadcastToUsers(targetUsers, message);
        } else if (userId) {
          broadcastToUser(userId, message);
        }
        break;

      case "get_status":
        return NextResponse.json({
          activeConnections: connections.size,
          activeUsers: getActiveUserIds(),
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
