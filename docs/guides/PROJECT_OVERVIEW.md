# NextLevel Coaching Platform - Complete Project Documentation

## 🎯 **Project Summary**

NextLevel Coaching is a sophisticated **coaching management platform** built with Next.js 15, designed to help coaches scale their business from 15 to 50+ athletes. The platform provides comprehensive tools for program creation, client management, video analysis, and communication.

**Live URL**: https://nxlvlcoach.com  
**Repository**: Next.js 15 with App Router, TypeScript, Prisma, tRPC

---

## 🏗️ **Technology Stack**

### **Core Framework**

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **React 19** with modern hooks
- **Tailwind CSS** for styling

### **Backend & Database**

- **PostgreSQL** database
- **Prisma ORM** for database management
- **tRPC** for type-safe API calls
- **Kinde Auth** for authentication

### **External Services**

- **UploadThing** for file storage
- **Resend** for email notifications
- **YouTube API** for video integration
- **Vercel** for deployment and analytics

### **State Management & UI**

- **Zustand** for client state
- **React Query** for server state
- **Radix UI** for accessible components
- **Framer Motion** for animations

---

## 🗄️ **Database Schema Overview**

### **Core User Models**

```prisma
User {
  id, email, name, role (COACH/CLIENT)
  subscriptionTier, subscriptionStatus
  organizationId, isAdmin
  workingHours, timeSlotInterval
  // 50+ relationships to other models
}

Client {
  id, name, email, phone, coachId
  physical stats (age, height, dominantHand, etc.)
  performance metrics (speed, spin rates, etc.)
  archived, archivedAt
  // Relationships to programs, messages, etc.
}

Organization {
  id, name, description, tier
  ownerId, coachLimit, clientLimit
  // Multi-coach support
}
```

### **Program System (Hierarchical)**

```prisma
Program {
  id, title, description, level, duration
  coachId, organizationId, sharedWithOrg
  weeks[] -> ProgramWeek[] -> ProgramDay[] -> ProgramDrill[]
}

ProgramAssignment {
  programId, clientId, startDate, progress
  currentCycle, repetitions
  // Tracks client progress through programs
}
```

### **Communication System**

```prisma
Conversation {
  id, coachId, clientId, type
  messages[] -> Message[]
  // Real-time messaging with attachments
}

Message {
  id, conversationId, senderId, content
  attachmentUrl, attachmentType, attachmentSize
  isRead, isAcknowledged, requiresAcknowledgment
}
```

### **Scheduling & Events**

```prisma
Event {
  id, title, description, date, startTime, endTime
  clientId, coachId, status (PENDING/CONFIRMED/DECLINED)
  reminderSent, confirmationRequired
  // Lesson scheduling with reminders
}

TimeSwapRequest {
  requesterId, targetId, requesterEventId, targetEventId
  status, message, approvedAt
  // Client-initiated rescheduling
}
```

### **Video & Media System**

```prisma
LibraryResource {
  id, title, description, url, thumbnail
  coachId, isYoutube, youtubeId, playlistId
  isMasterLibrary, isFeatured
  // Video library management
}

Video {
  id, title, description, url, thumbnail
  uploadedBy, clientId, category, status
  annotations[], audioNotes[], feedback[]
  // Client video submissions
}

VideoAnnotation {
  id, videoId, coachId, type, data, timestamp
  // Canvas-based video analysis
}
```

---

## 🎨 **UI/UX Design System**

### **Color Palette**

```css
--background: #2A3133 (Dark Background)
--card: #353A3A (Card/Box Background)
--foreground: #ABA4AA (Light Text)
--muted: #606364 (Border/Text Accent)
--accent: #C3BCC2 (Soft Highlight)
```

### **Component Architecture**

- **Desktop**: Sidebar navigation with main content area
- **Mobile**: Bottom tab navigation with dedicated mobile components
- **Responsive**: Mobile-first design with breakpoint-specific components
- **Theme**: Dark theme with custom moody palette

### **Key UI Patterns**

- **Modals**: Extensive modal system for forms and interactions
- **Real-time Updates**: SSE-powered live notifications
- **Loading States**: Skeleton loaders and loading spinners
- **Error Boundaries**: Comprehensive error handling
- **Toast Notifications**: User feedback system

---

## 🔐 **Authentication & Security**

### **Auth Flow**

1. **Kinde OAuth** → User authentication
2. **Role Selection** → New users choose Coach/Client
3. **Database Sync** → User data synced with Prisma
4. **Session Management** → Persistent sessions with middleware

### **Security Features**

- **Rate Limiting**: 100 req/min general, 20 req/min API
- **Bot Detection**: User-agent filtering
- **CSP Headers**: Content Security Policy
- **Input Validation**: Zod schemas
- **File Security**: Type validation for uploads

---

## 🚀 **Core Business Features**

### **1. Program Builder**

- **Visual Interface**: Drag-and-drop week/day/drill creation
- **Templates**: Reusable program templates
- **Routines**: Exercise libraries for quick assignment
- **Coach Instructions**: Detailed notes for each drill
- **Supersets**: Complex exercise grouping
- **Organization Sharing**: Multi-coach program sharing

### **2. Client Management**

- **Profiles**: Comprehensive athlete profiles with photos
- **Physical Stats**: Height, dominant hand, movement style, speeds
- **Progress Tracking**: Completion rates and analytics
- **Notes System**: Coach notes with history and pinning
- **Archiving**: Auto-archive inactive clients
- **Compliance Data**: Track drill completion rates

### **3. Video Analysis**

- **Canvas Tools**: Drawing, highlighting, annotation
- **Audio Notes**: Voice feedback recording
- **Screen Recording**: Coach demonstration capture
- **YouTube Integration**: Import and manage YouTube content
- **Comparison Tools**: Side-by-side video analysis
- **Thumbnail Generation**: Automatic video thumbnails

### **4. Scheduling System**

- **Time Slots**: Configurable lesson durations (default 60min)
- **Working Hours**: Coach availability management
- **Swap Requests**: Client-initiated rescheduling
- **Reminders**: Automated email notifications
- **Conflict Resolution**: Smart scheduling conflict handling
- **Blocked Times**: Coach unavailability management

### **5. Communication Hub**

- **Real-time Messaging**: SSE-powered chat system
- **File Sharing**: Secure attachment system
- **Mass Messaging**: Bulk client communication
- **Message Acknowledgment**: Read receipt system
- **Email Integration**: Automated email notifications
- **Quick Message Popup**: Fast client communication

---

## 📱 **Mobile Experience**

### **Dedicated Mobile Components**

- `MobileDashboard`, `MobileClientsPage`, `MobileProgramsPage`
- `MobileSchedulePage`, `MobileMessagesPage`, `MobileLibraryPage`
- `MobileClientProgramPage`, `MobileClientSchedulePage`

### **Mobile Features**

- **Bottom Navigation**: Tab-based mobile navigation
- **Touch Optimized**: Mobile-specific interactions
- **PWA Support**: Service worker and offline capabilities
- **Responsive Design**: Adaptive layouts for all screen sizes

---

## 🔧 **Technical Architecture**

### **File Structure**

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Coach dashboard
│   ├── clients/           # Client management
│   ├── programs/          # Program builder
│   ├── schedule/          # Scheduling system
│   ├── messages/          # Communication
│   ├── library/           # Video library
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── Dashboard.tsx     # Desktop dashboard
│   ├── MobileDashboard.tsx # Mobile dashboard
│   └── [200+ components] # Feature components
├── trpc/                 # tRPC API layer
│   ├── routers/          # API route handlers
│   └── trpc.ts          # tRPC configuration
├── lib/                  # Utility libraries
│   ├── complete-email-service.ts
│   ├── youtube.ts
│   └── uploadthing-utils.ts
└── db/                   # Database connection
```

### **API Structure (tRPC)**

```typescript
// Main routers
appRouter = {
  user: userRouter, // User management
  clients: clientsRouter, // Client CRUD operations
  programs: programsRouter, // Program builder
  messaging: messagingRouter, // Communication
  events: eventsRouter, // Scheduling
  library: libraryRouter, // Video library
  analytics: analyticsRouter, // Business metrics
  organization: organizationRouter, // Multi-coach
  // ... 20+ domain routers
};
```

### **State Management**

- **Server State**: React Query with tRPC
- **Client State**: Zustand stores
- **Real-time**: SSE for messaging and notifications
- **Caching**: Multi-layer caching strategy

---

## 📊 **Business Intelligence**

### **Coach Analytics**

- Client count and retention rates
- Program completion statistics
- Revenue tracking
- Performance metrics

### **Client Analytics**

- Drill completion rates
- Workout frequency
- Progress tracking
- Engagement metrics

### **Organization Features**

- Multi-coach support
- Shared resources
- Team management
- Billing and subscriptions

---

## 🚀 **Deployment & Performance**

### **Production Setup**

- **Vercel**: Hosting and deployment
- **PostgreSQL**: Database (production)
- **CDN**: Static asset delivery
- **Monitoring**: Vercel Analytics + custom error tracking

### **Performance Optimizations**

- **Code Splitting**: Lazy loading for mobile components
- **Image Optimization**: Next.js Image with WebP/AVIF
- **Bundle Analysis**: Webpack optimization
- **Caching**: API, database, and CDN caching

---

## 🔄 **Development Workflow**

### **Scripts**

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "db:migrate": "tsx scripts/migrate.ts migrate",
  "db:studio": "prisma studio"
}
```

### **Code Quality**

- **TypeScript**: Strict type checking
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Jest**: Testing framework setup
- **Error Boundaries**: Comprehensive error handling

---

## 🎯 **Key Business Value**

### **For Coaches**

1. **Scale Business**: Manage 15-50+ athletes efficiently
2. **Save Time**: Automated scheduling and reminders
3. **Professional Tools**: Video analysis and program building
4. **Client Retention**: Progress tracking and communication
5. **Revenue Growth**: Data-driven business insights

### **For Athletes**

1. **Structured Training**: Clear program progression
2. **Video Feedback**: Professional coaching analysis
3. **Communication**: Direct coach-athlete messaging
4. **Progress Tracking**: Visual progress monitoring
5. **Flexible Scheduling**: Easy lesson rescheduling

---

## 🔧 **Common Development Tasks**

### **Adding New Features**

1. Create tRPC router in `src/trpc/routers/`
2. Add database models to `prisma/schema.prisma`
3. Create React components in `src/components/`
4. Add mobile version in `Mobile*` components
5. Update navigation in `Sidebar.tsx` and `MobileBottomNavigation.tsx`

### **Database Changes**

1. Modify `prisma/schema.prisma`
2. Run `npm run db:migrate` to create migration
3. Update tRPC routers to use new fields
4. Update TypeScript types

### **UI Components**

- Use existing components from `src/components/ui/`
- Follow design system patterns
- Create both desktop and mobile versions
- Add proper loading and error states

---

## 📝 **Quick Reference**

### **Important Files**

- `prisma/schema.prisma` - Database schema
- `src/trpc/index.ts` - Main API router
- `src/components/ClientSideMobileWrapper.tsx` - Page routing
- `src/components/Sidebar.tsx` - Desktop navigation
- `src/lib/complete-email-service.ts` - Email system

### **Key Environment Variables**

```env
DATABASE_URL=postgresql://...
KINDE_CLIENT_ID=...
KINDE_CLIENT_SECRET=...
RESEND_API_KEY=...
UPLOADTHING_SECRET=...
YOUTUBE_API_KEY=...
```

### **Common Patterns**

- **Role-based Access**: Check `userProfile?.role` for COACH/CLIENT
- **Mobile Detection**: Use `useMobileDetection()` hook
- **Real-time Updates**: Use SSE hooks for live data
- **Error Handling**: Wrap components in ErrorBoundary
- **Loading States**: Use SkeletonLoader components

---

This documentation provides a comprehensive overview of the NextLevel Coaching platform. For specific implementation details, refer to the source code and inline comments throughout the codebase.
