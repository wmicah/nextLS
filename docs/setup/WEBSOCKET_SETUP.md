# WebSocket Setup for Real-time Messaging

This guide explains how to set up WebSocket/Socket.io for real-time messaging to replace polling and reduce database usage.

## Overview

The messaging system has been updated to support WebSocket connections via Socket.io, which eliminates the need for polling every 3-10 seconds. This significantly reduces database queries and improves performance.

## Current Implementation

### ✅ What's Already Done

1. **Socket.io Client Hook** (`src/hooks/useSocket.ts`)

   - Manages Socket.io connections
   - Handles reconnection automatically
   - Subscribes to conversations
   - Provides real-time message updates

2. **Socket.io Server Module** (`src/lib/socket-server.ts`)

   - Connection management
   - Room-based broadcasting
   - User authentication

3. **Updated Messaging Components**

   - `MessagesPage.tsx` - Uses Socket.io instead of polling
   - `MessagingServiceProvider.tsx` - Manages global Socket.io connection

4. **Updated Messaging Router**
   - Broadcasts new messages via Socket.io
   - Falls back to SSE if Socket.io unavailable

## Setup Options

### Option 1: Socket.io with Custom Next.js Server (Recommended for Development)

Create a custom server file:

**`server.js`** (in project root):

```javascript
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Import and initialize socket server
  const { initSocketServer } = require("./src/lib/socket-server");
  initSocketServer(httpServer);

  httpServer.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

### Option 2: Separate WebSocket Server (Recommended for Production)

Run Socket.io on a separate server/port:

**`socket-server.js`**:

```javascript
const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Import socket server logic
const { initSocketServer } = require("./src/lib/socket-server");
initSocketServer(server);

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
```

Update `.env`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Option 3: Use a WebSocket Service (Easiest for Production)

Use a managed service like:

- **Pusher** (https://pusher.com)
- **Ably** (https://ably.com)
- **Supabase Realtime** (if using Supabase)

These services handle scaling, reconnections, and infrastructure for you.

## Environment Variables

Add to `.env`:

```env
# Socket.io URL (if using separate server)
NEXT_PUBLIC_SOCKET_URL=/api/socket.io

# Or for separate server:
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Testing

1. Start your server with Socket.io support
2. Open the messaging page
3. Check browser console for "Socket.io connected" message
4. Send a message - it should appear instantly without polling
5. Check Network tab - you should see WebSocket connection instead of repeated polling requests

## Benefits

✅ **Reduced Database Load**: No more polling every 3-10 seconds
✅ **Real-time Updates**: Messages appear instantly
✅ **Better Performance**: Lower latency, less server load
✅ **Scalability**: WebSocket connections are more efficient than HTTP polling

## Fallback Behavior

If Socket.io is not available, the system automatically falls back to:

1. Server-Sent Events (SSE)
2. Polling (as last resort)

This ensures the messaging system works even if WebSocket setup is incomplete.

## Troubleshooting

### Socket.io not connecting

- Check that the server is running with Socket.io support
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
- Check browser console for connection errors
- Ensure CORS is configured correctly

### Messages not appearing in real-time

- Verify Socket.io server is broadcasting messages
- Check that clients are subscribed to the conversation
- Look for errors in server logs

### High database usage still

- Ensure polling is disabled (check `refetchInterval: false`)
- Verify Socket.io connection is active
- Check that components are using `useSocket` hook

## Next Steps

1. Choose a setup option above
2. Install Socket.io dependencies (already done: `socket.io` and `socket.io-client`)
3. Set up the server according to your chosen option
4. Test the real-time messaging
5. Monitor database query reduction
