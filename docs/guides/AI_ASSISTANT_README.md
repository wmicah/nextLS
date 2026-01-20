# Next Level Softball - AI Assistant Reference Guide

## 🎯 Project Overview

**Next Level Softball** is a comprehensive coaching platform for softball training with AI-powered features, video analysis, and personalized training programs. The platform connects coaches with clients through messaging, scheduling, program management, and video feedback systems.

## 🏗️ Architecture & Tech Stack

### Core Technologies

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript with strict configuration
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Kinde Auth
- **Real-time**: Supabase for messaging
- **File Storage**: UploadThing
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand + React Query (TanStack Query)
- **API**: tRPC for type-safe APIs

### Key Dependencies

```json
{
  "next": "15.5.3",
  "react": "19.1.0",
  "typescript": "^5",
  "prisma": "^6.13.0",
  "@trpc/server": "^11.4.3",
  "@trpc/react": "^9.27.4",
  "@kinde-oss/kinde-auth-nextjs": "^2.8.6",
  "@supabase/supabase-js": "^2.57.2",
  "uploadthing": "^7.7.3",
  "tailwindcss": "^4",
  "zustand": "^5.0.8"
}
```

## 📊 Database Schema (Prisma)

### Core Models

- **User**: Coaches and clients with role-based access
- **Client**: Client profiles with physical metrics and coach relationships
- **Conversation/Message**: Real-time messaging system with file attachments
- **Program**: Multi-week training programs with drills and exercises
- **Event**: Scheduling system with time swap functionality
- **Video**: Video uploads with feedback and annotation system
- **LibraryResource**: Video library with YouTube integration
- **Analytics**: Client and coach performance tracking

### Key Relationships

- Users can be coaches or clients
- Coaches have multiple clients
- Programs contain weeks → days → drills
- Video feedback system with annotations and audio notes
- Time swap requests between clients
- Comprehensive analytics tracking

## 🔧 Configuration & Environment

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
KINDE_CLIENT_ID="..."
KINDE_CLIENT_SECRET="..."
KINDE_ISSUER_URL="..."

# Real-time Messaging
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# File Storage
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# AI & Email
OPENAI_API_KEY="..."
RESEND_API_KEY="..."

# Security
JWT_SECRET="..."
NEXTAUTH_SECRET="..."
```

## 🚀 Development Setup

### Scripts Available

```bash
# Development
npm run dev              # Start with Turbopack
npm run dev:webpack      # Start with Webpack

# Building & Production
npm run build           # Production build
npm run start           # Start production server

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix linting issues
npm run type-check      # TypeScript check
npm run format          # Prettier formatting

# Testing
npm run test            # Run Jest tests
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode

# Database
npm run db:migrate      # Run migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio
npm run db:push         # Push schema changes

# Quality Assurance
npm run quality         # Full quality check
npm run pre-commit      # Pre-commit checks
```

## 🏛️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes
│   ├── dashboard/          # Main dashboard
│   ├── schedule/           # Scheduling system
│   ├── messages/           # Messaging interface
│   ├── programs/           # Program management
│   ├── library/            # Video library
│   └── api/                # API routes
├── components/             # React components
│   ├── common/             # Shared components
│   ├── forms/              # Form components
│   ├── ui/                 # UI components
│   └── [feature]/          # Feature-specific components
├── lib/                    # Utilities and helpers
│   ├── stores/             # Zustand stores
│   └── hooks/              # Custom hooks
├── trpc/                   # tRPC API definitions
└── middleware.ts           # Next.js middleware
```

## 🔐 Security Features

### Middleware Protection

- Rate limiting (100 req/min general, 20 req/min sensitive)
- Bot detection and blocking
- Suspicious request filtering
- Security headers (CSP, HSTS, etc.)
- IP-based request tracking

### Authentication Flow

- Kinde Auth integration
- Role-based access control (Coach/Client)
- JWT token management
- Session validation
- Admin audit logging

## 📱 Key Features

### 1. Messaging System

- Real-time chat with Supabase
- File attachments (images, videos, documents)
- Message acknowledgments
- Client-to-client conversations
- Mobile-optimized interface

### 2. Program Management

- Multi-week training programs
- Drill-based structure with video integration
- Progress tracking and analytics
- Program assignments and replacements
- Routine management

### 3. Video Analysis

- Video upload and storage
- Canvas-based annotations
- Audio note recording
- Screen recording with overlays
- Video feedback system

### 4. Scheduling System

- Event scheduling with time slots
- Time swap requests between clients
- Working hours configuration
- Automated lesson reminders
- Calendar integration

### 5. Analytics & Reporting

- Client engagement metrics
- Coach performance tracking
- Program completion rates
- Activity streaks and retention
- Custom analytics goals

## 🎨 Design System

### Color Palette

```css
/* Dark Theme */
background: #2A3133      /* Dark Background */
card: #353A3A           /* Card/Box Background */
foreground: #ABA4AA      /* Light Text */
border: #606364         /* Border/Text Accent */
accent: #C3BCC2         /* Soft Highlight */
```

### Key Components

- **MaxWidthWrapper**: Consistent content width
- **ConditionalNavbar**: Role-based navigation
- **Sidebar**: Main navigation component
- **MessageFileUpload**: File attachment handling
- **RichMessageInput**: Enhanced message input
- **VideoPlayer**: Custom video player with annotations

## 🔄 State Management

### Zustand Stores

- **uiStore**: UI state (modals, sidebar, etc.)
- **clipboardStore**: Clipboard operations
- **selectionStore**: Selection state

### React Query

- Server state management
- Caching and synchronization
- Optimistic updates
- Background refetching

## 📊 Performance Optimizations

### Next.js Features

- App Router with streaming
- Image optimization
- Font optimization (Inter)
- Bundle analysis
- Static generation where possible

### Custom Optimizations

- Dynamic imports for heavy components
- Lazy loading for video components
- Debounced search and inputs
- Optimized polling strategies
- Cache optimization utilities

## 🧪 Testing Strategy

### Test Configuration

- Jest with React Testing Library
- Custom test utilities
- Component testing
- API route testing
- Coverage reporting

### Quality Gates

- ESLint with strict rules
- TypeScript strict mode
- Pre-commit hooks
- Automated testing
- Code formatting

## 🚀 Deployment

### Vercel Configuration

- Environment variables setup
- Database migrations
- Build optimization
- Security headers
- Performance monitoring

### Production Considerations

- Database connection pooling
- File upload limits
- Rate limiting
- Error monitoring
- Analytics integration

## 🔧 Common Tasks

### Adding New Features

1. Create database models in `prisma/schema.prisma`
2. Run `npm run db:migrate` to apply changes
3. Update tRPC routers in `src/trpc/`
4. Create React components in `src/components/`
5. Add API routes in `src/app/api/`
6. Update types and validation

### Debugging

- Check browser console for client errors
- Review server logs in terminal
- Use Prisma Studio for database inspection
- Check network tab for API calls
- Verify environment variables

### Performance Issues

- Run `npm run build:analyze` for bundle analysis
- Check database query performance
- Review image optimization
- Monitor API response times
- Use React DevTools for component analysis

## 🚨 Critical Files to Monitor

### High-Impact Files

- `src/middleware.ts` - Security and rate limiting
- `src/app/layout.tsx` - Global providers and setup
- `prisma/schema.prisma` - Database structure
- `src/trpc/index.ts` - API definitions
- `src/components/MessagesPage.tsx` - Core messaging
- `src/components/Sidebar.tsx` - Navigation

### Configuration Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Styling configuration
- `tsconfig.json` - TypeScript settings
- `package.json` - Dependencies and scripts

## 📝 Development Notes

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Tailwind for styling
- Implement proper error boundaries
- Add loading states for async operations

### Best Practices

- Keep components small and focused
- Use proper TypeScript types
- Implement proper error handling
- Add loading and error states
- Optimize for mobile devices
- Follow accessibility guidelines

## 🔍 Troubleshooting

### Common Issues

1. **Database connection**: Check `DATABASE_URL` in `.env`
2. **Authentication**: Verify Kinde configuration
3. **File uploads**: Check UploadThing credentials
4. **Real-time messaging**: Verify Supabase setup
5. **Build errors**: Run `npm run type-check`

### Debug Commands

```bash
npm run db:status        # Check migration status
npm run health-check     # System health check
npm run lint:strict      # Strict linting
npm run type-check:strict # Strict type checking
```

## 📈 Monitoring & Analytics

### Built-in Monitoring

- Error boundary implementation
- Performance monitoring
- Database query optimization
- API response time tracking
- User activity analytics

### External Services

- Vercel Analytics (optional)
- Sentry error tracking (optional)
- Google Analytics (optional)

---

**Last Updated**: January 2025
**Project Status**: Active Development
**Maintainer**: AI Assistant
**Next Review**: When significant changes are made
