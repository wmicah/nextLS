"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Users,
  Video,
  MessageSquare,
  BookOpen,
  Settings,
  Plus,
  HelpCircle,
  Target,
  FileText,
  Shield,
  Star,
  DollarSign,
  Info,
  Play,
  TrendingUp,
  UserCheck,
  BookOpenCheck,
  Clock,
  Sparkles,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  message: string;
  color: string;
}

interface ChatbotQuickActionsProps {
  onActionClick: (message: string) => void;
  userRole?: "coach" | "client" | "visitor";
}

export default function ChatbotQuickActions({
  onActionClick,
  userRole = "visitor",
}: ChatbotQuickActionsProps) {
  // Coach-specific actions
  const coachActions: QuickAction[] = [
    {
      id: "create-program",
      label: "Create Program",
      icon: <Plus className="h-4 w-4" />,
      message:
        "How do I create a new training program with weeks, days, and drills?",
      color:
        "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    },
    {
      id: "manage-clients",
      label: "Manage Clients",
      icon: <Users className="h-4 w-4" />,
      message: "How do I add, manage, and track my clients' progress?",
      color:
        "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    },
    {
      id: "upload-video",
      label: "Upload Video",
      icon: <Video className="h-4 w-4" />,
      message: "How do I upload and organize videos in the library?",
      color:
        "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
      message: "How do I schedule lessons and manage appointments?",
      color:
        "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    },
    {
      id: "training-levels",
      label: "Training Levels",
      icon: <Target className="h-4 w-4" />,
      message:
        "What are the different training levels (Drive, Whip, Separation, etc.)?",
      color:
        "bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
    },
    {
      id: "drills",
      label: "Drills",
      icon: <FileText className="h-4 w-4" />,
      message: "How do I create and organize drills with video demonstrations?",
      color:
        "bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
      message: "How do I communicate with my clients through messages?",
      color:
        "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    },
    {
      id: "library",
      label: "Library",
      icon: <BookOpen className="h-4 w-4" />,
      message: "How do I organize and share my video library?",
      color:
        "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="h-4 w-4" />,
      message: "How is my data protected and what are the security features?",
      color:
        "bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      message: "Where can I find my account settings and preferences?",
      color:
        "bg-gradient-to-br from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700",
    },
    {
      id: "help",
      label: "Help",
      icon: <HelpCircle className="h-4 w-4" />,
      message: "What can you help me with on this platform?",
      color:
        "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
    },
  ];

  // Client-specific actions
  const clientActions: QuickAction[] = [
    {
      id: "view-programs",
      label: "My Programs",
      icon: <BookOpenCheck className="h-4 w-4" />,
      message: "How do I view and access my training programs?",
      color:
        "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    },
    {
      id: "video-library",
      label: "Video Library",
      icon: <Play className="h-4 w-4" />,
      message: "How do I access videos shared by my coach?",
      color:
        "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
      message: "How do I send messages to my coach?",
      color:
        "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
      message: "How do I view my lesson schedule?",
      color:
        "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    },
    {
      id: "progress",
      label: "My Progress",
      icon: <TrendingUp className="h-4 w-4" />,
      message: "How do I track my training progress?",
      color:
        "bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
    },
    {
      id: "training-levels",
      label: "Training Levels",
      icon: <Target className="h-4 w-4" />,
      message: "What are the different training levels and what do they mean?",
      color:
        "bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
    },
    {
      id: "drills",
      label: "Drills",
      icon: <FileText className="h-4 w-4" />,
      message: "How do I understand and perform the drills in my programs?",
      color:
        "bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Clock className="h-4 w-4" />,
      message: "How do I manage notifications and reminders?",
      color:
        "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      id: "profile",
      label: "Profile",
      icon: <UserCheck className="h-4 w-4" />,
      message: "How do I update my profile and preferences?",
      color:
        "bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="h-4 w-4" />,
      message: "How is my data protected and private?",
      color:
        "bg-gradient-to-br from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700",
    },
    {
      id: "help",
      label: "Help",
      icon: <HelpCircle className="h-4 w-4" />,
      message: "What can you help me with as a client?",
      color:
        "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
    },
  ];

  // Visitor/landing page actions (limited to basic info only)
  const visitorActions: QuickAction[] = [
    {
      id: "features",
      label: "Features",
      icon: <Star className="h-4 w-4" />,
      message: "What features does Next Level Softball offer?",
      color:
        "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    },
    {
      id: "benefits",
      label: "Benefits",
      icon: <TrendingUp className="h-4 w-4" />,
      message: "How can Next Level Softball help improve training?",
      color:
        "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    },
    {
      id: "for-coaches",
      label: "For Coaches",
      icon: <Users className="h-4 w-4" />,
      message: "What features are available for coaches?",
      color:
        "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    },
    {
      id: "for-athletes",
      label: "For Athletes",
      icon: <Target className="h-4 w-4" />,
      message: "What features are available for athletes?",
      color:
        "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    },
    {
      id: "pricing",
      label: "Pricing",
      icon: <DollarSign className="h-4 w-4" />,
      message: "What are the pricing plans and what's included?",
      color:
        "bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
    },
    {
      id: "demo",
      label: "Demo",
      icon: <Play className="h-4 w-4" />,
      message: "Can I see a demo of the platform?",
      color:
        "bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
    },
    {
      id: "signup",
      label: "Sign Up",
      icon: <Plus className="h-4 w-4" />,
      message: "How do I sign up for Next Level Softball?",
      color:
        "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="h-4 w-4" />,
      message: "How secure is the platform and my data?",
      color:
        "bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
    },
    {
      id: "faq",
      label: "FAQ",
      icon: <HelpCircle className="h-4 w-4" />,
      message: "What are the most frequently asked questions?",
      color:
        "bg-gradient-to-br from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700",
    },
    {
      id: "contact",
      label: "Contact",
      icon: <MessageSquare className="h-4 w-4" />,
      message: "How can I contact support or get more information?",
      color:
        "bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
    },
  ];

  // Select actions based on user role
  const getActions = () => {
    switch (userRole) {
      case "coach":
        return coachActions;
      case "client":
        return clientActions;
      default:
        return visitorActions;
    }
  };

  const getSectionTitle = () => {
    switch (userRole) {
      case "coach":
        return "Coach Tools";
      case "client":
        return "Athlete Tools";
      default:
        return "Learn More";
    }
  };

  const actions = getActions();

  return (
    <Card className="mb-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          {getSectionTitle()}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map(action => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className={`h-auto p-3 flex flex-col items-center gap-2 text-xs font-medium ${action.color} text-white hover:text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-xl`}
              onClick={() => onActionClick(action.message)}
            >
              {action.icon}
              <span className="text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
