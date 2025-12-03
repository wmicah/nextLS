/**
 * WebSocket Server for Real-time Messaging
 * 
 * This module manages WebSocket connections and provides functions
 * to broadcast messages to specific users or conversations.
 */

import { WebSocket } from "ws";

// Store active WebSocket connections by userId
const userConnections = new Map<string, Set<WebSocket>>();

// Store connections by conversationId for targeted broadcasts
const conversationConnections = new Map<string, Set<WebSocket>>();

/**
 * Add a WebSocket connection for a user
 */
export function addConnection(userId: string, ws: WebSocket) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(ws);

  // Handle connection close
  ws.on("close", () => {
    removeConnection(userId, ws);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    removeConnection(userId, ws);
  });

  // Send connection confirmation
  sendToConnection(ws, {
    type: "connection_established",
    data: { message: "WebSocket connected successfully" },
  });
}

/**
 * Remove a WebSocket connection
 */
export function removeConnection(userId: string, ws: WebSocket) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }

  // Remove from conversation connections
  conversationConnections.forEach((conns, conversationId) => {
    conns.delete(ws);
    if (conns.size === 0) {
      conversationConnections.delete(conversationId);
    }
  });
}

/**
 * Subscribe a connection to a conversation
 */
export function subscribeToConversation(
  conversationId: string,
  userId: string,
  ws: WebSocket
) {
  if (!conversationConnections.has(conversationId)) {
    conversationConnections.set(conversationId, new Set());
  }
  conversationConnections.get(conversationId)!.add(ws);

  // Ensure connection is tracked for this user
  addConnection(userId, ws);
}

/**
 * Unsubscribe a connection from a conversation
 */
export function unsubscribeFromConversation(
  conversationId: string,
  ws: WebSocket
) {
  const connections = conversationConnections.get(conversationId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      conversationConnections.delete(conversationId);
    }
  }
}

/**
 * Send a message to a specific user
 */
export function sendToUser(userId: string, message: any) {
  const connections = userConnections.get(userId);
  if (!connections) {
    return false;
  }

  let sentCount = 0;
  const messageStr = JSON.stringify(message);

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error(`Error sending to user ${userId}:`, error);
        removeConnection(userId, ws);
      }
    } else {
      // Remove closed connections
      removeConnection(userId, ws);
    }
  });

  return sentCount > 0;
}

/**
 * Send a message to all users in a conversation
 */
export function sendToConversation(conversationId: string, message: any) {
  const connections = conversationConnections.get(conversationId);
  if (!connections) {
    return false;
  }

  let sentCount = 0;
  const messageStr = JSON.stringify(message);

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error(`Error sending to conversation ${conversationId}:`, error);
        // Remove closed connections
        connections.delete(ws);
      }
    } else {
      // Remove closed connections
      connections.delete(ws);
    }
  });

  return sentCount > 0;
}

/**
 * Send a message to multiple users
 */
export function sendToUsers(userIds: string[], message: any) {
  let totalSent = 0;
  userIds.forEach((userId) => {
    if (sendToUser(userId, message)) {
      totalSent++;
    }
  });
  return totalSent;
}

/**
 * Broadcast a message to all connected users
 */
export function broadcast(message: any) {
  let totalSent = 0;
  const messageStr = JSON.stringify(message);

  userConnections.forEach((connections, userId) => {
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          totalSent++;
        } catch (error) {
          console.error(`Error broadcasting to user ${userId}:`, error);
          removeConnection(userId, ws);
        }
      } else {
        removeConnection(userId, ws);
      }
    });
  });

  return totalSent;
}

/**
 * Send a message to a specific WebSocket connection
 */
function sendToConnection(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending to connection:", error);
      return false;
    }
  }
  return false;
}

/**
 * Get active connection count for a user
 */
export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.size || 0;
}

/**
 * Get total active connections
 */
export function getTotalConnections(): number {
  let total = 0;
  userConnections.forEach((connections) => {
    total += connections.size;
  });
  return total;
}

/**
 * Get active user IDs
 */
export function getActiveUserIds(): string[] {
  return Array.from(userConnections.keys());
}

