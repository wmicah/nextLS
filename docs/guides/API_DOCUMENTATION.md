# Next Level Softball - API Documentation

## Overview

This document provides comprehensive documentation for the Next Level Softball coaching platform API. The API is built using Next.js 15 with tRPC for type-safe communication between client and server.

## Table of Contents

1. [Authentication](#authentication)
2. [Core API Endpoints](#core-api-endpoints)
3. [Client Management](#client-management)
4. [Program Management](#program-management)
5. [Scheduling](#scheduling)
6. [Messaging](#messaging)
7. [Video Management](#video-management)
8. [Analytics](#analytics)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

## Authentication

### Overview

The application uses Kinde for authentication with role-based access control.

### User Roles

- `coach`: Full access to all features
- `client`: Limited access to assigned programs and messages

### Authentication Flow

```typescript
// Client-side authentication check
const { user, isAuthenticated } = useKindeAuth();

// Server-side authentication
const { getUser } = getKindeServerSession();
const user = await getUser();
```

## Core API Endpoints

### Health Check

```typescript
GET / api / health;
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

## Client Management

### Get All Clients

```typescript
trpc.clients.list.useQuery({ archived: false });
```

**Parameters:**

- `archived` (boolean, optional): Filter by archived status

**Response:**

```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "client";
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Create Client

```typescript
trpc.clients.create.mutate({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
});
```

### Update Client

```typescript
trpc.clients.update.mutate({
  id: "client-id",
  name: "John Smith",
  email: "johnsmith@example.com",
});
```

### Archive Client

```typescript
trpc.clients.archive.mutate({ id: "client-id" });
```

## Program Management

### Get All Programs

```typescript
trpc.programs.list.useQuery();
```

**Response:**

```typescript
interface Program {
  id: string;
  title: string;
  description?: string;
  duration: number; // in weeks
  difficulty: "beginner" | "intermediate" | "advanced";
  days: ProgramDay[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  drills: ProgramDrill[];
  isRestDay: boolean;
}

interface ProgramDrill {
  id: string;
  type: "exercise" | "drill" | "video" | "routine" | "rest";
  title: string;
  description?: string;
  duration?: number; // in minutes
  sets?: number;
  reps?: number;
  restTime?: number; // in seconds
}
```

### Create Program

```typescript
trpc.programs.create.mutate({
  title: "Beginner Softball Program",
  description: "A comprehensive program for beginners",
  duration: 8,
  difficulty: "beginner",
  days: [
    {
      dayNumber: 1,
      title: "Day 1: Fundamentals",
      drills: [
        {
          type: "exercise",
          title: "Basic Throwing",
          duration: 30,
          sets: 3,
          reps: 10,
        },
      ],
    },
  ],
});
```

### Assign Program to Client

```typescript
trpc.programs.assignToClients.mutate({
  programId: "program-id",
  clientIds: ["client-1", "client-2"],
  startDate: new Date(),
  notes: "Optional assignment notes",
});
```

## Scheduling

### Get Coach Schedule

```typescript
trpc.scheduling.getCoachSchedule.useQuery({
  startDate: new Date(),
  endDate: new Date(),
});
```

### Get Client Schedule

```typescript
trpc.scheduling.getClientSchedule.useQuery({
  clientId: "client-id",
  startDate: new Date(),
  endDate: new Date(),
});
```

### Schedule Lesson

```typescript
trpc.scheduling.scheduleLesson.mutate({
  clientId: "client-id",
  date: new Date(),
  time: "14:00",
  duration: 60,
  type: "lesson",
  notes: "Focus on batting technique",
});
```

### Update Working Hours

```typescript
trpc.updateWorkingHours.mutate({
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  startTime: "09:00",
  endTime: "17:00",
  timeSlotInterval: 15, // minutes
});
```

## Messaging

### Get Conversations

```typescript
trpc.messaging.getConversations.useQuery();
```

### Send Message

```typescript
trpc.messaging.sendMessage.mutate({
  conversationId: "conversation-id",
  content: "Hello, how are you?",
  attachments: [
    {
      type: "image",
      url: "https://example.com/image.jpg",
      name: "technique.jpg",
    },
  ],
});
```

### Get Unread Counts

```typescript
trpc.messaging.getConversationUnreadCounts.useQuery();
```

## Video Management

### Upload Video

```typescript
POST /api/upload-master-video
Content-Type: multipart/form-data

FormData:
- file: File
- title: string
- description?: string
- category?: string
```

### Get Video Library

```typescript
trpc.library.list.useQuery({ type: "video" });
```

### Assign Video to Client

```typescript
trpc.library.assignVideoToClient.mutate({
  videoId: "video-id",
  clientId: "client-id",
  dueDate: new Date(),
  notes: "Review this technique",
});
```

## Analytics

### Get Client Analytics

```typescript
trpc.analytics.getClientAnalytics.useQuery({
  clientId: "client-id",
  startDate: new Date(),
  endDate: new Date(),
});
```

### Get Coach Analytics

```typescript
trpc.analytics.getCoachAnalytics.useQuery({
  startDate: new Date(),
  endDate: new Date(),
});
```

## Error Handling

### Standard Error Response

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
```

### Common Error Codes

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

### Error Handling Example

```typescript
try {
  const result = await trpc.clients.create.mutate(clientData);
  // Handle success
} catch (error) {
  if (error.data?.code === "VALIDATION_ERROR") {
    // Handle validation errors
    console.error("Validation failed:", error.data.details);
  } else if (error.data?.code === "UNAUTHORIZED") {
    // Redirect to login
    router.push("/auth/signin");
  } else {
    // Handle other errors
    console.error("Unexpected error:", error);
  }
}
```

## Rate Limiting

### Limits

- **API Calls**: 1000 requests per hour per user
- **File Uploads**: 10 files per hour per user
- **Message Sending**: 100 messages per hour per user

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Lesson Reminders

```typescript
POST / api / cron / lesson - reminders;
```

Automatically sends reminder emails for upcoming lessons.

### Message Notifications

```typescript
POST / api / sse / messages;
```

Server-Sent Events for real-time message notifications.

## Performance Optimization

### Caching

- **Client Data**: 5 minutes
- **Program Data**: 10 minutes
- **Schedule Data**: 2 minutes
- **Analytics Data**: 1 hour

### Database Optimization

- Indexed fields: `userId`, `clientId`, `programId`, `createdAt`
- Connection pooling enabled
- Query optimization for large datasets

## Security

### Data Protection

- All API endpoints require authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### File Upload Security

- File type validation
- Size limits (100MB max)
- Virus scanning
- Secure file storage

## Monitoring

### Performance Metrics

- Response times
- Error rates
- Cache hit rates
- Database query performance

### Logging

- All API calls logged
- Error tracking
- Performance monitoring
- User activity tracking

## Support

For API support or questions:

- Email: support@nextlevelsoftball.com
- Documentation: [Link to docs]
- Status Page: [Link to status page]

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial API release
- Core functionality implemented
- Authentication system
- Client and program management
- Scheduling system
- Messaging system
- Video management
- Analytics dashboard
