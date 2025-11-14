"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Users,
  Target,
  Calendar,
  MessageSquare,
  TrendingUp,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  LogOut,
  AlertTriangle,
  Settings,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import SwitchCoachModal from "@/components/SwitchCoachModal";
import { trpc } from "@/app/_trpc/client";

export default function ClientWaitingPage() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSwitchCoachModal, setShowSwitchCoachModal] = useState(false);
  const router = useRouter();

  // Get client record to check if archived
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  const { data: clientRecord } = trpc.clients.getMyClientRecord.useQuery(
    undefined,
    {
      enabled: !!userProfile,
    }
  );

  const handleLogout = () => {
    // Redirect to Kinde logout with prompt=login to force re-authentication
    window.location.href = "/api/auth/logout?post_logout_redirect_url=/";
  };

  // Auto-refresh every 30 seconds to check for coach assignment
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
      // Refresh the page to check for coach assignment
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Program Calendar",
      description:
        "Your daily drills and exercises assigned by your coach, with instructional videos and progress tracking.",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Schedule Management",
      description:
        "View your coach's schedule, request lessons, and switch with other athletes within available time slots.",
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Coach Communication",
      description:
        "Send videos, files, and messages to your coach. Confirm or deny lesson switches and get feedback.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Personal Stats",
      description:
        "Track your progress with stats and metrics that your coach updates based on your performance.",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Interactive Training",
      description:
        "Watch videos, comment on exercises, send practice videos back, and check off completed drills.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Notification Center",
      description:
        "Never miss important alerts, lesson reminders, or updates from your coach.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Coach Assignment",
      description:
        "Your coach will add you to their client list and send you a welcome message.",
    },
    {
      number: "2",
      title: "Program Calendar",
      description:
        "Access your personalized training calendar with daily drills and exercises assigned by your coach.",
    },
    {
      number: "3",
      title: "Schedule Management",
      description:
        "View your coach's schedule, request lessons, and switch with other athletes within available time slots.",
    },
    {
      number: "4",
      title: "Interactive Training",
      description:
        "Watch instructional videos, comment, send practice videos back, and check off completed exercises.",
    },
    {
      number: "5",
      title: "Full Platform Access",
      description:
        "Track progress, communicate with your coach, and manage all aspects of your training.",
    },
  ];

  return (
    <div
      className="min-h-screen px-4 sm:px-6 lg:px-8 pt-6"
      style={{ backgroundColor: "#2A3133" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Next Level Softball!
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            {clientRecord?.archived
              ? "You're no longer with your previous coach. Request to join a new coach to continue your training journey."
              : "We're excited to have you on board! Your coach will be in touch soon to get you started on your softball journey."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-200 font-medium">
                {clientRecord?.archived
                  ? "No active coach"
                  : "Waiting for coach assignment..."}
              </span>
            </div>
            <button
              onClick={() => setShowSwitchCoachModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#4A5A70] to-[#606364] hover:from-[#5A6A80] hover:to-[#707080] border border-[#606364] transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <UserPlus className="h-4 w-4 text-white" />
              <span className="text-white font-medium">
                {clientRecord?.archived ? "Switch Coach" : "Join a Coach"}
              </span>
            </button>
          </div>
        </div>

        {/* Platform Walkthrough Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Platform Walkthrough
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Here's what you'll have access to once your coach adds you to
              their client list:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative p-6 rounded-2xl border transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-300">{step.description}</p>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Key Platform Features
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Your dashboard will include these powerful tools to enhance your
              training experience:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 group"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Need Help?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              If you have any questions or need assistance, don't hesitate to
              reach out to our support team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div
              className="p-6 rounded-2xl border flex items-center gap-4"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-400"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Email Support
                </h3>
                <p className="text-gray-300">support@nextlevelsoftball.com</p>
              </div>
            </div>

            <div
              className="p-6 rounded-2xl border flex items-center gap-4"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-400"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Phone Support
                </h3>
                <p className="text-gray-300">(555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Management Section */}
        <div
          className="mt-12 p-8 rounded-2xl border"
          style={{
            backgroundColor: "#1E1E1E",
            borderColor: "#2a2a2a",
          }}
        >
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-gray-400" />
              <h3 className="text-xl font-semibold text-white">
                Account Options
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Need to make changes to your account or role?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>

            {/* Delete Account Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <AlertTriangle className="h-4 w-4" />
              Delete Account
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Selected the wrong role? You can delete your account and register
              again with the correct role.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center py-8 border-t"
          style={{ borderColor: "#606364" }}
        >
          <p className="text-gray-400">
            This page will automatically update when your coach adds you to
            their client list.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Next Level Softball • Empowering athletes to reach their full
            potential
          </p>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Switch Coach Modal */}
      <SwitchCoachModal
        isOpen={showSwitchCoachModal}
        onClose={() => setShowSwitchCoachModal(false)}
        onSuccess={() => {
          // Refresh the page after successful coach request
          window.location.reload();
        }}
      />
    </div>
  );
}
