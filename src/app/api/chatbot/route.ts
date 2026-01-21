import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: Message[];
  context?: {
    currentPage?: string;
    userRole?: string;
    recentActions?: string[];
  };
}

// Initialize OpenAI client conditionally
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

// Comprehensive knowledge base for Next Level Softball platform
const platformKnowledge = {
  // User Roles and Permissions
  roles: {
    coach: {
      description:
        "Coaches have full access to create programs, manage clients, upload videos, and access analytics.",
      capabilities: [
        "Create and manage training programs",
        "Add and manage clients",
        "Upload and organize videos",
        "Schedule lessons and appointments",
        "Send messages to clients",
        "View analytics and performance data",
        "Access all platform features",
      ],
    },
    client: {
      description:
        "Clients can view assigned programs, access shared videos, and communicate with their coach.",
      capabilities: [
        "View assigned training programs",
        "Access shared video library",
        "Send messages to coach",
        "View schedule and appointments",
        "Track personal progress",
      ],
    },
  },

  // Core Features
  features: {
    programs: {
      overview:
        "Training programs are structured plans organized by weeks and days, with specific drills and exercises.",
      creation:
        "To create a program: 1) Go to Programs section, 2) Click 'Create Program', 3) Set title, description, and level, 4) Add weeks and days, 5) Add drills to each day with video demonstrations.",
      structure:
        "Programs are organized as: Program → Weeks → Days → Drills. Each drill can include title, description, duration, video URL, and notes.",
      levels: {
        Drive:
          "Beginner level - Focus on basic fundamentals and building foundation",
        Whip: "Intermediate level - Developing technique and consistency",
        Separation: "Advanced level - Mastering complex movements and timing",
        Stability: "Conditioning level - Building strength and endurance",
        Extension:
          "Expert level - Perfecting advanced techniques and performance",
      },
    },
    clients: {
      overview:
        "Client management allows coaches to track athletes' progress and communicate effectively.",
      management:
        "Add clients with email, name, and optional role. View client list, track progress, and manage communication. Archive inactive clients.",
      communication:
        "Send direct messages to clients, share videos and attachments, and maintain conversation history.",
    },
    schedule: {
      overview:
        "Scheduling system for managing lessons, appointments, and training sessions.",
      features:
        "View calendar, book time slots, manage availability, send reminders, and coordinate with clients.",
    },
    library: {
      overview:
        "Video library for organizing training materials and sharing with clients.",
      organization:
        "Upload videos, organize by categories, share with specific clients or programs, and maintain a searchable database.",
    },
    messages: {
      overview: "Built-in messaging system for coach-client communication.",
      features:
        "Send text messages, share attachments, maintain conversation history, and receive notifications.",
    },
    analytics: {
      overview: "Performance tracking and business insights.",
      features:
        "View client progress, track program effectiveness, monitor business metrics, and generate reports.",
    },
  },

  // Workflows and Processes
  workflows: {
    "program creation": {
      steps: [
        "Navigate to Programs section",
        "Click 'Create Program' button",
        "Fill in program details (title, description, level)",
        "Set program duration in weeks",
        "Add weeks with titles and descriptions",
        "Add days to each week",
        "Add drills to each day with video demonstrations",
        "Save and publish the program",
      ],
      tips: "Use descriptive titles, include video demonstrations for drills, and organize content logically by skill progression.",
    },
    "client onboarding": {
      steps: [
        "Go to Clients section",
        "Click 'Add Client'",
        "Enter client email and name",
        "Set client role (optional)",
        "Send invitation to join platform",
        "Assign training programs",
        "Share relevant videos from library",
      ],
      tips: "Welcome new clients with a personalized message and clear instructions on how to access their programs.",
    },
    "video management": {
      steps: [
        "Navigate to Library section",
        "Click 'Upload Video'",
        "Select video file (MP4, MOV, AVI supported)",
        "Add title and description",
        "Organize into categories",
        "Share with specific clients or programs",
        "Manage video permissions",
      ],
      tips: "Use descriptive titles, organize videos by skill level or category, and ensure proper permissions for sharing.",
    },
  },

  // Security and Privacy
  security: {
    overview:
      "Next Level Softball prioritizes data security and privacy protection.",
    features: [
      "Secure authentication with Kinde Auth",
      "Encrypted data transmission (HTTPS)",
      "Role-based access control",
      "Secure file uploads and storage",
      "Regular security updates",
      "Data backup and recovery",
      "Privacy-compliant data handling",
    ],
    privacy:
      "Client data is protected and only accessible to authorized coaches. Videos and messages are private and secure.",
  },

  // Troubleshooting
  troubleshooting: {
    login:
      "If you can't log in, check your email and password. Use 'Forgot Password' if needed. Ensure you're using the correct account type (coach vs client).",
    upload:
      "For video uploads: Check file format (MP4, MOV, AVI), ensure file size is under limit, verify internet connection, and try refreshing the page.",
    messages:
      "If messages aren't sending: Check internet connection, verify recipient is active, ensure you have proper permissions, and try refreshing the page.",
    schedule:
      "For scheduling issues: Check time slot availability, verify you have scheduling permissions, ensure client is added to your list, and check for conflicts.",
    programs:
      "If programs aren't loading: Check internet connection, verify program permissions, ensure client is properly assigned, and try refreshing the page.",
  },

  // Best Practices
  bestPractices: {
    coaching: [
      "Create structured, progressive training programs",
      "Use video demonstrations for clear instruction",
      "Regularly communicate with clients",
      "Track progress and adjust programs accordingly",
      "Maintain organized video library",
      "Set clear expectations and goals",
    ],
    platform: [
      "Keep programs updated and organized",
      "Use descriptive titles and descriptions",
      "Regularly backup important data",
      "Maintain active client relationships",
      "Utilize analytics for program improvement",
      "Stay updated with platform features",
    ],
  },
};

// Enhanced response generation with OpenAI GPT
async function generateIntelligentResponse(
  userMessage: string,
  history: Message[],
  context?: any
): Promise<string> {
  try {
    // Create system prompt with platform knowledge
    const systemPrompt = `You are an AI assistant for Next Level Softball, a comprehensive training platform for coaches and athletes. You have deep knowledge of the platform and should provide helpful, accurate, and context-aware responses.

PLATFORM KNOWLEDGE:
${JSON.stringify(platformKnowledge, null, 2)}

CURRENT CONTEXT:
- User Role: ${context?.userRole || "visitor"}
- Current Page: ${context?.currentPage || "unknown"}
- Recent Actions: ${context?.recentActions?.join(", ") || "none"}

RESPONSE GUIDELINES:
1. Be helpful, friendly, and professional
2. Use the platform knowledge to provide accurate information
3. Consider the user's role (coach/client/visitor) when responding
4. Provide specific, actionable advice when possible
5. Use markdown formatting for better readability (bold with **text**, italics with *text*)
6. Keep responses concise but informative
7. If you don't know something specific about the platform, say so and suggest contacting support
8. For visitors, focus on general features, pricing, and benefits
9. For coaches, provide detailed workflow guidance
10. For clients, focus on how to use assigned features

IMPORTANT: Only provide information about the Next Level Softball platform. Do not give advice about general softball training unless specifically asked, and even then, focus on how the platform can help with that training.`;

    // Prepare conversation history for context
    const conversationHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system message and current user message
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    // Call OpenAI API using standard chat completions with full platform knowledge
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini ",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content ?? "No response text";
  } catch (error) {

    // Check if it's a quota error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "insufficient_quota"
    ) {

    }

    // Fallback to rule-based response if OpenAI fails
    return generateFallbackResponse(userMessage, context);
  }
}

// Fallback rule-based response system
function generateFallbackResponse(userMessage: string, context?: any): string {
  const message = userMessage.toLowerCase();

  // Role-specific responses
  if (message.includes("coach") || message.includes("instructor")) {
    return `As a coach on Next Level Softball, you have access to all platform features including program creation, client management, video library, scheduling, messaging, and analytics. You can create comprehensive training programs with weeks, days, and drills, manage your client roster, upload and organize videos, schedule lessons, and track performance data.`;
  }

  if (
    message.includes("client") ||
    message.includes("athlete") ||
    message.includes("player")
  ) {
    return `As a client, you can view your assigned training programs, access shared videos from your coach, send messages, view your schedule, and track your progress. Your coach will create personalized programs for you and share relevant training materials through the platform.`;
  }

  // Program creation detailed guidance
  if (
    message.includes("create program") ||
    message.includes("new program") ||
    message.includes("program creation") ||
    message.includes("help with program") ||
    message.includes("program help") ||
    message.includes("building program") ||
    message.includes("making program") ||
    (message.includes("programs") &&
      (message.includes("help") ||
        message.includes("create") ||
        message.includes("build") ||
        message.includes("make"))) ||
    message.includes("training program") ||
    message.includes("workout program") ||
    message.includes("exercise program") ||
    (message.includes("program") &&
      (message.includes("need") ||
        message.includes("want") ||
        message.includes("looking"))) ||
    (message.includes("need help") && message.includes("program")) ||
    (message.includes("help") &&
      message.includes("creating") &&
      message.includes("program"))
  ) {
    return `To create a training program:

1. **Navigate to Programs** - Click the Programs section in the navigation
2. **Create New Program** - Click the "Create Program" button
3. **Program Details** - Fill in:
   - Title (e.g., "Advanced Pitching Program")
   - Description (overview of the program)
   - Level (Drive/Whip/Separation/Stability/Extension)
   - Duration (number of weeks)
4. **Add Structure** - Create weeks and days:
   - Add weeks with titles like "Week 1: Fundamentals"
   - Add days to each week (e.g., "Day 1: Basic Mechanics")
5. **Add Drills** - For each day, add drills with:
   - Title and description
   - Duration
   - Video demonstration URL
   - Notes for technique focus
6. **Save & Publish** - Review and publish your program

**Pro Tip**: Use video demonstrations for each drill to provide clear visual instruction to your clients.`;
  }

  // Training levels explanation
  if (
    message.includes("training level") ||
    message.includes("drive") ||
    message.includes("whip") ||
    message.includes("separation") ||
    message.includes("stability") ||
    message.includes("extension")
  ) {
    return `Next Level Softball uses a progressive training system with 5 levels:

🏃 **Drive (Beginner)**: Focus on basic fundamentals, building foundation, and developing proper form. Perfect for new athletes or those learning fundamentals.

⚡ **Whip (Intermediate)**: Developing technique, consistency, and building on fundamentals. Athletes start refining movements and building speed.

🎯 **Separation (Advanced)**: Mastering complex movements, timing, and advanced techniques. Focus on precision and performance optimization.

💪 **Stability (Conditioning)**: Building strength, endurance, and physical conditioning. Emphasizes fitness and injury prevention.

🚀 **Extension (Expert)**: Perfecting advanced techniques, maximizing performance, and elite-level training. For experienced athletes seeking peak performance.

Choose the level that matches your client's current skill and development stage.`;
  }

  // Client management
  if (
    message.includes("add client") ||
    message.includes("manage client") ||
    message.includes("client management") ||
    message.includes("help with client") ||
    message.includes("client help") ||
    (message.includes("clients") &&
      (message.includes("help") ||
        message.includes("manage") ||
        message.includes("add")))
  ) {
    return `To manage clients effectively:

**Adding New Clients:**
1. Go to Clients section
2. Click "Add Client"
3. Enter email and name
4. Set role (optional)
5. Send invitation

**Client Management Features:**
- View all clients in your roster
- Track individual progress
- Send direct messages
- Share videos and programs
- Archive inactive clients
- Monitor engagement

**Best Practices:**
- Welcome new clients with personalized messages
- Assign appropriate training programs
- Share relevant videos from your library
- Maintain regular communication
- Track progress and adjust programs accordingly`;
  }

  // Video library management
  if (
    message.includes("upload video") ||
    message.includes("video library") ||
    message.includes("video management") ||
    message.includes("help with video") ||
    message.includes("video help") ||
    (message.includes("videos") &&
      (message.includes("help") ||
        message.includes("upload") ||
        message.includes("manage")))
  ) {
    return `**Video Library Management:**

**Uploading Videos:**
1. Navigate to Library section
2. Click "Upload Video"
3. Select file (MP4, MOV, AVI supported)
4. Add title and description
5. Organize into categories
6. Set sharing permissions

**Organization Tips:**
- Use descriptive titles (e.g., "Pitching Mechanics - Step 1")
- Create categories (Fundamentals, Advanced, Conditioning)
- Tag videos by skill level or position
- Share specific videos with individual clients
- Maintain a searchable database

**Security:** Videos are private and only accessible to you and clients you specifically share them with.`;
  }

  // Security and privacy
  if (
    message.includes("security") ||
    message.includes("privacy") ||
    message.includes("data protection")
  ) {
    return `**Security & Privacy on Next Level Softball:**

🔒 **Data Protection:**
- Secure authentication with Kinde Auth
- Encrypted data transmission (HTTPS)
- Role-based access control
- Secure file uploads and storage

🛡️ **Privacy Features:**
- Client data only accessible to authorized coaches
- Private messaging between coach and client
- Secure video sharing with specific permissions
- Regular security updates and monitoring

🔐 **Best Practices:**
- Use strong passwords
- Log out when using shared devices
- Only share videos with intended clients
- Regularly review client access permissions

Your data and your clients' information are protected with enterprise-level security measures.`;
  }

  // Scheduling
  if (
    message.includes("schedule") ||
    message.includes("appointment") ||
    message.includes("lesson")
  ) {
    return `**Scheduling System:**

**Features:**
- View calendar with all appointments
- Book time slots for lessons
- Manage your availability
- Send automatic reminders
- Coordinate with clients

**How to Schedule:**
1. Go to Schedule section
2. Select available time slot
3. Choose client and lesson type
4. Add notes or instructions
5. Send confirmation to client

**Best Practices:**
- Set regular availability windows
- Send reminders 24 hours before lessons
- Include lesson focus areas in notes
- Track lesson outcomes and progress`;
  }

  // Analytics and tracking
  if (
    message.includes("analytics") ||
    message.includes("track") ||
    message.includes("progress")
  ) {
    return `**Analytics & Progress Tracking:**

**Available Metrics:**
- Client engagement and activity
- Program completion rates
- Video view statistics
- Message response times
- Overall platform usage

**How to Use Analytics:**
1. Visit Analytics section
2. View dashboard with key metrics
3. Track individual client progress
4. Monitor program effectiveness
5. Identify areas for improvement

**Best Practices:**
- Regularly review client progress
- Use data to adjust training programs
- Track which videos are most effective
- Monitor client engagement patterns
- Set goals and measure outcomes`;
  }

  // General help
  if (
    message.includes("help") ||
    message.includes("what can you do") ||
    message.includes("assistance") ||
    message.includes("support") ||
    message.includes("guidance")
  ) {
    const helpResponse = `I'm your Next Level Softball AI assistant! I can help you with:

🎯 **Program Management:**
- Creating training programs with weeks, days, and drills
- Understanding training levels (Drive, Whip, Separation, Stability, Extension)
- Organizing content and video demonstrations

👥 **Client Management:**
- Adding and managing clients
- Tracking progress and engagement
- Communication and messaging

📹 **Video Library:**
- Uploading and organizing videos
- Sharing content with clients
- Managing permissions and access

📅 **Scheduling:**
- Booking lessons and appointments
- Managing availability
- Client coordination

📊 **Analytics:**
- Tracking performance and progress
- Monitoring engagement
- Business insights

🔒 **Security & Privacy:**
- Data protection information
- Privacy features
- Best practices

**Current Context:** ${
      context?.currentPage ? `You're on the ${context.currentPage} page.` : ""
    } ${context?.userRole ? `You're logged in as a ${context.userRole}.` : ""}

What would you like to know more about?`;

    return helpResponse;
  }

  // Visitor-specific responses (landing page)
  if (
    message.includes("features") ||
    message.includes("what does") ||
    message.includes("offer")
  ) {
    return `**Next Level Softball Features:**

🎯 **For Coaches:**
- Create comprehensive training programs with weeks, days, and drills
- Manage client roster and track progress
- Upload and organize video library
- Schedule lessons and appointments
- Send messages and share content
- View analytics and performance data

🏃 **For Athletes:**
- Access personalized training programs
- View shared videos and demonstrations
- Communicate with your coach
- Track progress and performance
- View lesson schedule
- Receive notifications and reminders

📱 **Platform Features:**
- Mobile-responsive design
- Real-time messaging
- Video sharing and organization
- Progress tracking
- Secure data protection
- Role-based access control`;
  }

  if (
    message.includes("pricing") ||
    message.includes("cost") ||
    message.includes("price")
  ) {
    return `**Next Level Softball Pricing:**

💼 **Coach Plans:**
- **Starter**: $29/month - Up to 10 clients, basic features
- **Professional**: $59/month - Up to 50 clients, advanced analytics
- **Enterprise**: $99/month - Unlimited clients, priority support

🏃 **Athlete Plans:**
- **Individual**: $19/month - Access to assigned programs
- **Team**: $15/month per athlete - Team management features

✨ **All Plans Include:**
- Secure video library
- Real-time messaging
- Progress tracking
- Mobile access
- 24/7 support
- Data backup

**Pricing**: Plans start at just $25/month. Athletes always train free!`;
  }

  if (
    message.includes("benefits") ||
    message.includes("help improve") ||
    message.includes("advantages")
  ) {
    return `**How Next Level Softball Improves Training:**

📈 **For Coaches:**
- **Save Time**: Create programs once, assign to multiple clients
- **Better Organization**: Structured training with video demonstrations
- **Client Engagement**: Real-time communication and progress tracking
- **Business Growth**: Analytics help optimize training programs
- **Professional Image**: Modern platform enhances your coaching brand

🏆 **For Athletes:**
- **Structured Training**: Clear, progressive programs
- **Visual Learning**: Video demonstrations for every drill
- **Coach Connection**: Direct communication and feedback
- **Progress Tracking**: See your improvement over time
- **Flexibility**: Train anywhere, anytime with mobile access

🎯 **Overall Benefits:**
- **Consistency**: Standardized training methodology
- **Accountability**: Track completion and progress
- **Communication**: Seamless coach-athlete interaction
- **Results**: Data-driven improvement tracking`;
  }

  if (
    message.includes("demo") ||
    message.includes("see") ||
    message.includes("show")
  ) {
    return `**Platform Demo Options:**

🎬 **Video Demo**: Watch a 3-minute overview of the platform features
📱 **Interactive Demo**: Try the platform with sample data
👥 **Live Demo**: Schedule a personalized walkthrough with our team

**To get started:**
1. Click "Sign Up" to create your account
2. Choose your plan and subscribe
3. Start building your first program or join as an athlete

**Contact us** for a personalized demo tailored to your specific needs!`;
  }

  if (
    message.includes("sign up") ||
    message.includes("register") ||
    message.includes("join")
  ) {
    return `**How to Sign Up for Next Level Softball:**

🚀 **Quick Start:**
1. Click the "Sign Up" button in the top navigation
2. Choose your role (Coach or Athlete)
3. Enter your email and create a password
4. Complete your profile information
5. Subscribe to your plan

📋 **What You'll Need:**
- **Coaches**: Basic information about your coaching business
- **Athletes**: Your coach's invitation code (if applicable)

✨ **Getting Started:**
- Full access to all features
- Plans starting at $25/month
- Cancel anytime
- Athletes always train free

**Need help?** Our support team is available 24/7 to assist with setup!`;
  }

  if (
    message.includes("contact") ||
    message.includes("support") ||
    message.includes("help")
  ) {
    return `**Contact & Support:**

📧 **Email Support**: support@nextlevelsoftball.com
💬 **Live Chat**: Available on our website
📞 **Phone**: 1-800-NEXT-LEVEL (Mon-Fri, 9AM-6PM EST)
📱 **In-App Support**: Use the help section in your dashboard

**Response Times:**
- **Email**: Within 24 hours
- **Live Chat**: Immediate response
- **Phone**: During business hours
- **Urgent Issues**: Priority support available

**Resources:**
- Help Center with video tutorials
- FAQ section
- User guides and documentation
- Community forum for coaches`;
  }

  if (message.includes("faq") || message.includes("frequently asked")) {
    return `**Frequently Asked Questions:**

❓ **General:**
- **Is my data secure?** Yes, we use enterprise-level encryption
- **Can I cancel anytime?** Yes, no long-term contracts
- **Is there a mobile app?** Yes, works on all devices

❓ **For Coaches:**
- **How many clients can I have?** Depends on your plan (10-50-unlimited)
- **Can I import existing programs?** Yes, we support various formats
- **Do clients need accounts?** Yes, but setup is simple

❓ **For Athletes:**
- **How do I get started?** Your coach will send you an invitation
- **Can I access programs offline?** Yes, download for offline viewing
- **What if I have questions?** Message your coach directly

❓ **Technical:**
- **What video formats are supported?** MP4, MOV, AVI
- **Is there a file size limit?** Yes, up to 500MB per video
- **Can I use on multiple devices?** Yes, syncs across all devices`;
  }

  if (message.includes("about") || message.includes("tell me more")) {
    return `**About Next Level Softball:**

🎯 **Our Mission**: To revolutionize softball training by providing coaches and athletes with the most comprehensive, user-friendly platform for creating, managing, and following structured training programs.

🏆 **What We Do**: We bridge the gap between traditional coaching methods and modern technology, making it easier for coaches to deliver high-quality training and for athletes to achieve their full potential.

📈 **Our Story**: Founded by former collegiate softball players and coaches who experienced the challenges of traditional training methods firsthand. We built Next Level Softball to solve these problems and create a better way to train.

🌟 **Why Choose Us:**
- **Expert-Built**: Created by coaches, for coaches
- **User-Friendly**: Intuitive design for all skill levels
- **Comprehensive**: Everything you need in one platform
- **Secure**: Enterprise-level data protection
- **Supportive**: 24/7 customer support

**Join thousands of coaches and athletes** who have already transformed their training with Next Level Softball!`;
  }

  // Greetings
  if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("hey")
  ) {
    return `Hello! I'm your Next Level Softball AI assistant. I'm here to help you navigate the platform, create amazing training programs, manage your clients, and make the most of all our features. 

Whether you're a coach looking to create comprehensive training programs, a client wanting to understand your workouts, or a visitor exploring our platform, I can help! What would you like to know?`;
  }

  // Default response with platform context
  return `I understand you're asking about Next Level Softball. Let me help you with that!

Based on your question, here are some ways I can assist you:

🎯 **If you need help with programs:**
• Creating training programs with weeks, days, and drills
• Understanding program structure and organization
• Adding video demonstrations to drills
• Setting up program levels and progression

👥 **If you need help with clients:**
• Adding and managing your client roster
• Tracking client progress and engagement
• Communication and messaging features
• Assigning programs to clients

📹 **If you need help with videos:**
• Uploading and organizing your video library
• Sharing videos with specific clients
• Managing video permissions and access
• Creating video demonstrations for drills

📅 **If you need help with scheduling:**
• Setting up lessons and appointments
• Managing your availability
• Coordinating with clients
• Sending reminders and notifications

Could you be more specific about what you'd like help with? I'm here to guide you through any aspect of the Next Level Softball platform!`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Generate intelligent response using OpenAI GPT
    const response = await generateIntelligentResponse(
      message,
      history,
      context
    );

    // Simulate natural processing time
    await new Promise(resolve =>
      setTimeout(resolve, 300 + Math.random() * 700)
    );

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Next Level Softball Chatbot API is running",
    timestamp: new Date().toISOString(),
    version: "3.0.0",
    features:
      "OpenAI GPT integration, enhanced platform knowledge, role-based responses, security-aware",
  });
}
