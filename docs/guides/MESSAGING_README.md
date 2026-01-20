# 🚀 Enhanced Messaging System

## Overview

We've built a comprehensive messaging system that provides real-time communication between coaches and clients. The system includes modern chat features, file sharing, notifications, and a beautiful UI.

## ✨ Features

### 🎨 **Modern Chat Interface**

- **Real-time messaging** with auto-refresh every 3-5 seconds
- **Beautiful UI** with dark theme and smooth animations
- **Message status indicators** (sent, delivered, read)
- **Auto-scroll** to latest messages
- **Responsive design** for mobile and desktop

### 📁 **File Sharing**

- **Drag & drop** file uploads
- **Multiple file types** supported:
  - Images (PNG, JPG, JPEG, GIF, WebP)
  - Videos (MP4, MOV, AVI, MKV)
  - Audio (MP3, WAV, M4A)
  - Documents (PDF, DOC, DOCX)
  - Text files (TXT, MD)
- **File size validation** (10MB limit)
- **File type validation** with proper error handling

### 🔔 **Smart Notifications**

- **Real-time notifications** for new messages
- **Sound alerts** with fallback audio generation
- **Browser notifications** (with permission request)
- **Visual notification badges** on sidebar
- **Notification settings** (sound on/off)
- **Auto-dismiss** notifications after 5 seconds

### 🎯 **Conversation Management**

- **Conversation list** with search functionality
- **Unread message counts** with badges
- **Last message preview** with timestamps
- **Conversation archiving** and deletion
- **Direct conversation links** (`/messages/[id]`)

### 🔒 **Security & Privacy**

- **Role-based access** (coaches can only message their clients)
- **JWT-based authentication** for all endpoints
- **Input validation** and sanitization
- **File upload security** with type checking

## 📁 File Structure

```
src/
├── app/
│   ├── messages/
│   │   ├── page.tsx                    # Main messages page
│   │   └── [id]/
│   │       └── page.tsx                # Individual conversation page
├── components/
│   ├── MessagesPage.tsx                # Main messaging interface
│   ├── ConversationPage.tsx            # Individual conversation view
│   ├── MessageFileUpload.tsx           # File upload component
│   ├── MessageNotification.tsx         # Notification system
│   └── MessagePopup.tsx                # Legacy popup (can be removed)
├── trpc/
│   └── index.ts                        # Enhanced messaging endpoints
└── prisma/
    └── schema.prisma                   # Updated with file attachments
```

## 🛠️ Technical Implementation

### Database Schema Updates

```prisma
model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderId       String
  content        String
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())

  // File attachment support
  attachmentUrl  String?
  attachmentType String? // "image", "video", "document", "audio"
  attachmentName String?
  attachmentSize Int? // in bytes

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([senderId])
}
```

### tRPC Endpoints

#### Enhanced Messaging Router

- `getConversations` - List all conversations with unread counts
- `getMessages` - Get messages for a conversation (auto-marks as read)
- `sendMessage` - Send a message with optional file attachment
- `createConversation` - Create new conversation between coach and client
- `getConversation` - Get single conversation details
- `markAsRead` - Mark messages as read
- `deleteConversation` - Delete conversation and all messages
- `getUnreadCount` - Get total unread message count

### File Upload Flow

1. **Client selects file** via drag & drop or file picker
2. **File validation** (size, type, security)
3. **Upload to storage** (UploadThing integration)
4. **Save to database** with file metadata
5. **Send message** with file attachment
6. **Real-time update** to all participants

### Notification System

1. **Polling** - Check for new messages every 5 seconds
2. **Sound alerts** - Play notification sound (with fallback)
3. **Browser notifications** - Show system notifications
4. **Visual badges** - Update sidebar with unread counts
5. **Auto-dismiss** - Remove notifications after 5 seconds

## 🚀 Getting Started

### 1. Database Migration

```bash
npx prisma migrate dev --name add_message_attachments
```

### 2. Install Dependencies

```bash
npm install react-dropzone
```

### 3. Add Notification Sound

Add a notification sound file to `/public/notification.mp3`

### 4. Environment Variables

Ensure your `.env` file includes:

```env
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## 🎯 Usage

### For Coaches

1. **Navigate to Messages** - Click "Messages" in the sidebar
2. **View conversations** - See all client conversations
3. **Send messages** - Type and send text or files
4. **Manage conversations** - Archive or delete conversations

### For Clients

1. **Access Messages** - Click "Messages" in the sidebar
2. **Chat with coach** - Send messages and files
3. **View notifications** - Get real-time alerts for new messages

## 🔧 Configuration

### Notification Settings

Users can:

- **Toggle sound** on/off
- **View unread count** in real-time
- **Clear notifications** manually
- **Customize browser notifications**

### File Upload Limits

- **Max file size**: 10MB
- **Supported types**: Images, videos, audio, documents, text
- **Security**: Type validation and sanitization

## 🎨 UI Components

### MessagesPage

- **Conversation sidebar** with search and filtering
- **Chat area** with message bubbles
- **File upload** with drag & drop
- **Real-time updates** with auto-refresh

### ConversationPage

- **Individual conversation** view
- **Message history** with timestamps
- **File attachments** with preview
- **Conversation actions** (archive, delete)

### MessageNotification

- **Floating notification** button
- **Settings panel** for customization
- **Toast notifications** with animations
- **Sound management** with fallback

## 🔮 Future Enhancements

### Planned Features

- **Real-time WebSocket** connections
- **Message reactions** (like, heart, etc.)
- **Message threading** and replies
- **Voice messages** recording
- **Video calls** integration
- **Message search** functionality
- **Message encryption** for privacy
- **Read receipts** with timestamps
- **Typing indicators** in real-time
- **Message editing** and deletion

### Performance Optimizations

- **Message pagination** for large conversations
- **Image compression** for faster uploads
- **Lazy loading** for message history
- **Caching** for frequently accessed data

## 🐛 Troubleshooting

### Common Issues

1. **File upload fails**

   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure UploadThing credentials are set

2. **Notifications not working**

   - Check browser notification permissions
   - Verify sound file exists at `/public/notification.mp3`
   - Check console for JavaScript errors

3. **Messages not updating**
   - Verify tRPC queries are running
   - Check network connectivity
   - Ensure user authentication is valid

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_MESSAGING=true
```

## 📊 Analytics

The messaging system includes:

- **Message count** tracking
- **File upload** statistics
- **User engagement** metrics
- **Response time** analysis

## 🔒 Security Considerations

- **Input sanitization** for all messages
- **File type validation** to prevent malicious uploads
- **Role-based access** control for conversations
- **Rate limiting** on message sending
- **Data encryption** in transit and at rest

---

**Built with ❤️ for NextLS - The Ultimate Coaching Platform**
