/**
 * Socket.io Server for Real-time Messaging
 * 
 * This module manages Socket.io connections and provides functions
 * to emit messages to specific users or conversations.
 * 
 * Note: This requires a separate Socket.io server or using Socket.io
 * with Next.js custom server.
 * 
 * SERVER-ONLY: This file should never be imported on the client side.
 */

import type { Server as HTTPServer } from "http";

// Store Socket.io server instance
let io: any = null;

// Store user socket mappings
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketUsers = new Map<string, string>(); // socketId -> userId

/**
 * Initialize Socket.io server
 */
export function initSocketServer(httpServer: HTTPServer) {
  // Only import socket.io on server side
  if (typeof window !== "undefined") {
    throw new Error("initSocketServer can only be called on the server");
  }

  if (io) {
    return io;
  }

  // Dynamic import to avoid bundling on client
  const { Server: SocketIOServer } = require("socket.io");

  io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: any) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle authentication
    socket.on("authenticate", async (data: { userId: string }) => {
      const { userId } = data;
      
      // Store mapping
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      socketUsers.set(socket.id, userId);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Send confirmation
      socket.emit("authenticated", { userId });

      console.log(`Socket ${socket.id} authenticated as user ${userId}`);
    });

    // Handle conversation subscription
    socket.on("subscribe_conversation", (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} subscribed to conversation ${conversationId}`);
    });

    // Handle conversation unsubscription
    socket.on("unsubscribe_conversation", (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} unsubscribed from conversation ${conversationId}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
          }
        }
        socketUsers.delete(socket.id);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get Socket.io server instance
 */
export function getSocketServer(): any {
  return io;
}

/**
 * Send a message to a specific user
 */
export function emitToUser(userId: string, event: string, data: any): boolean {
  if (typeof window !== "undefined") {
    return false;
  }

  if (!io) {
    return false;
  }

  io.to(`user:${userId}`).emit(event, data);
  return true;
}

/**
 * Send a message to all users in a conversation
 */
export function emitToConversation(
  conversationId: string,
  event: string,
  data: any
): boolean {
  if (typeof window !== "undefined") {
    return false;
  }

  if (!io) {
    return false;
  }

  io.to(`conversation:${conversationId}`).emit(event, data);
  return true;
}

/**
 * Send a message to multiple users
 */
export function emitToUsers(
  userIds: string[],
  event: string,
  data: any
): number {
  if (typeof window !== "undefined") {
    return 0;
  }

  if (!io) {
    return 0;
  }

  let count = 0;
  userIds.forEach((userId) => {
    if (emitToUser(userId, event, data)) {
      count++;
    }
  });
  return count;
}

/**
 * Broadcast a message to all connected users
 */
export function broadcast(event: string, data: any): number {
  if (typeof window !== "undefined") {
    return 0;
  }

  if (!io) {
    return 0;
  }

  io.emit(event, data);
  return io.sockets.sockets.size;
}

/**
 * Get active connection count for a user
 */
export function getUserConnectionCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}

/**
 * Get total active connections
 */
export function getTotalConnections(): number {
  if (!io) {
    return 0;
  }
  return io.sockets.sockets.size || 0;
}

/**
 * Get active user IDs
 */
export function getActiveUserIds(): string[] {
  return Array.from(userSockets.keys());
}
