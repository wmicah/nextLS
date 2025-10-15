# NextLevel Coaching

**Professional Coaching Platform for Coaches and Athletes**

A comprehensive coaching platform that enables coaches to manage clients, create training programs, analyze videos, and track progress - all in one professional system.

## 🚀 **Live Application**

- **Domain**: [nxlvlcoach.com](https://nxlvlcoach.com)
- **Platform**: Professional Coaching Management
- **Target Users**: Coaches and Athletes

## ✨ **Key Features**

### **For Coaches**

- **Client Management**: Add, organize, and communicate with clients
- **Program Creation**: Build comprehensive training programs with video integration
- **Video Analysis**: Upload and analyze client videos with AI-powered insights
- **Scheduling**: Manage lessons, events, and client schedules
- **Analytics**: Track client progress and business metrics
- **Messaging**: Real-time communication with clients
- **Organization Management**: Multi-coach organizations with role-based access

### **For Athletes**

- **Personal Dashboard**: Access training programs and progress tracking
- **Video Submissions**: Submit videos for coach feedback
- **Progress Tracking**: Monitor improvement over time
- **Communication**: Direct messaging with coaches
- **Schedule Management**: View upcoming lessons and events

## 🛠 **Technology Stack**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Kinde Auth
- **File Uploads**: UploadThing
- **Email Service**: Resend
- **Real-time**: WebSockets & Server-Sent Events
- **AI Integration**: OpenAI
- **Video Processing**: YouTube API
- **State Management**: Zustand
- **Data Fetching**: tRPC with React Query
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Testing**: Jest & Testing Library
- **Deployment**: Vercel

## 🏗 **Architecture**

### **Frontend**

- **Next.js App Router**: Modern React framework with server-side rendering
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with custom theme
- **Component Library**: Radix UI for accessible components
- **State Management**: Zustand for client state, React Query for server state

### **Backend**

- **tRPC**: Type-safe API with automatic client generation
- **Prisma ORM**: Database management with type safety
- **PostgreSQL**: Reliable relational database
- **Authentication**: Kinde Auth with role-based access control
- **File Storage**: UploadThing for video and image uploads
- **Email Service**: Resend for transactional emails

### **Database Schema**

- **Users**: Coaches and athletes with role-based access
- **Organizations**: Multi-coach organizations with tiered access
- **Programs**: Training programs with weeks, days, and drills
- **Clients**: Client-coach relationships and progress tracking
- **Messaging**: Real-time communication system
- **Analytics**: Performance tracking and business metrics
- **Videos**: Video uploads, analysis, and feedback

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js 18+
- PostgreSQL database
- Kinde Auth account
- Resend account
- UploadThing account

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/nextlevel-coaching.git
   cd nextlevel-coaching
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 **Project Structure**

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Coach dashboard
│   ├── client-dashboard/   # Client dashboard
│   ├── auth/              # Authentication pages
│   └── api/                # API routes
├── components/             # Reusable UI components
├── lib/                    # Utility functions and services
├── trpc/                   # tRPC API routes
├── db/                     # Database configuration
└── hooks/                  # Custom React hooks
```

## 🔧 **Configuration**

### **Environment Variables**

See `env.example` for all required environment variables:

- **Database**: PostgreSQL connection string
- **Authentication**: Kinde Auth credentials
- **Email**: Resend API key
- **File Uploads**: UploadThing credentials
- **AI**: OpenAI API key
- **Analytics**: Google Analytics and Vercel Analytics

### **Database Setup**

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in your environment variables
3. Run `npx prisma db push` to create tables
4. Optionally run `npx prisma db seed` to populate with sample data

### **Authentication Setup**

1. Create a Kinde Auth account
2. Create a new application
3. Configure redirect URLs for your domain
4. Add credentials to environment variables

## 🚀 **Deployment**

### **Vercel Deployment**

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure custom domain (nxlvlcoach.com)
4. Deploy automatically on push to main branch

### **Domain Configuration**

1. Set up DNS records for nxlvlcoach.com
2. Configure SSL certificate
3. Update all hardcoded URLs in the codebase
4. Test email delivery with Resend

See [NEXTLEVEL_COACHING_DEPLOYMENT.md](./NEXTLEVEL_COACHING_DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 **Analytics & Monitoring**

- **Vercel Analytics**: Performance and usage metrics
- **Google Analytics**: User behavior tracking
- **Error Monitoring**: Built-in error tracking
- **Database Monitoring**: Prisma query performance

## 🔒 **Security Features**

- **Rate Limiting**: API rate limiting with Redis
- **Bot Detection**: Automated bot detection and blocking
- **Security Headers**: Comprehensive security headers
- **Input Validation**: Zod schema validation
- **Authentication**: Secure role-based access control
- **File Upload Security**: Secure file upload with validation

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [NEXTLEVEL_COACHING_DEPLOYMENT.md](./NEXTLEVEL_COACHING_DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/nextlevel-coaching/issues)
- **Email**: admin@nxlvlcoach.com

## 🎯 **Roadmap**

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with fitness trackers
- [ ] Multi-language support
- [ ] Advanced AI coaching insights
- [ ] Payment processing integration
- [ ] Advanced video analysis features

---

**NextLevel Coaching** - Professional Coaching Platform
Domain: [nxlvlcoach.com](https://nxlvlcoach.com)
