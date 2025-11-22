"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import {
  ArrowRight,
  Zap,
  Video,
  MessageSquare,
  Calendar,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Check,
  PlayCircle,
  Sparkles,
  Target,
  Brain,
  Shield,
  Smartphone,
  Globe,
  Palette,
  Layers,
  Repeat,
  FileVideo,
  Mic,
  Edit3,
  Share2,
  Bell,
  Lock,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  Settings,
  Library,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "demo" | "details" | "pricing"
  >("overview");

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    els.forEach(el => {
      el.classList.add(
        "opacity-0",
        "translate-y-4",
        "transition-all",
        "duration-700"
      );
    });
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add("opacity-100", "translate-y-0");
            el.classList.remove("opacity-0", "translate-y-4");
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(el => io.observe(el));
    return () => {
      els.forEach(el => io.unobserve(el));
      io.disconnect();
    };
  }, []);

  return (
    <main className="relative -mt-14 min-h-screen overflow-hidden bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />

      {/* HERO */}
      <section className="relative z-10 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12">
        <MaxWidthWrapper className="text-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="mx-auto max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              The Complete Platform for
              <br className="hidden sm:block" />
              <span className="block sm:inline"> </span>
              <span className="text-white">Modern Coaching</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-zinc-300 px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Every tool you need to run a professional coaching business - from
              program creation to video analysis to client communication - all
              in one beautiful platform.
            </motion.p>

            <motion.div
              className="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4 sm:flex-row sm:justify-center px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <RegisterLink className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:scale-[1.02] w-full sm:w-auto justify-center">
                Get Started
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </RegisterLink>
            </motion.div>
          </motion.div>
        </MaxWidthWrapper>
      </section>

      {/* Tab Navigation */}
      <section className="relative z-10 py-6 sm:py-8">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 w-full max-w-fit mx-auto sm:w-auto">
              {[
                {
                  id: "overview",
                  label: "Overview",
                },
                {
                  id: "demo",
                  label: "Live Demo",
                },
                {
                  id: "details",
                  label: "Details",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </MaxWidthWrapper>
      </section>

      {/* Tab Content */}
      <TabContent activeTab={activeTab} />

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#2A3133]">
        <MaxWidthWrapper className="px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">
                NextLevel Coaching
              </h3>
              <p className="text-zinc-400 mb-4 max-w-md">
                The professional platform trusted by elite coaches to build
                championship programs and develop athletes.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/features"
                    className="text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <RegisterLink className="text-zinc-400 hover:text-white transition-colors text-sm">
                    Get Started
                  </RegisterLink>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-500 text-sm">
              © {new Date().getFullYear()} NextLevel Coaching. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-zinc-500 hover:text-white transition-colors text-sm"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-zinc-500 hover:text-white transition-colors text-sm"
              >
                Terms
              </Link>
              <span className="text-zinc-500 text-sm">
                Powered by{" "}
                <Link
                  href="https://nexishq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white transition-colors font-semibold"
                >
                  Nexis
                </Link>
              </span>
            </div>
          </div>
        </MaxWidthWrapper>
      </footer>
    </main>
  );
}

// Tab Content Component
function TabContent({ activeTab }: { activeTab: string }) {
  return (
    <div className="relative z-10 py-12">
      <MaxWidthWrapper>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "demo" && <DemoTab />}
            {activeTab === "details" && <DetailsTab />}
          </motion.div>
        </AnimatePresence>
      </MaxWidthWrapper>
    </div>
  );
}

// Overview Tab
function OverviewTab() {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Platform Overview
      </motion.h2>
      <motion.p
        className="text-base sm:text-lg text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Everything you need to run a professional coaching business, all in one
        platform.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatedFeatureShowcase />
      </motion.div>
    </motion.div>
  );
}

// Demo Tab
function DemoTab() {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        See It In Action
      </motion.h2>
      <motion.p
        className="text-base sm:text-lg text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Watch how coaches use NextLevel to scale their business and serve more
        athletes.
      </motion.p>
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-8">
        <div className="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <PlayCircle className="h-12 w-12 sm:h-16 sm:w-16 text-white/50 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-white/70">
              Demo Video Coming Soon
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Details Tab
function DetailsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="text-3xl font-bold text-white mb-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Feature Details
      </motion.h2>

      {/* Everything You Can Do Section */}
      <motion.div
        className="mb-8 sm:mb-12 md:mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h3
          className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 md:mb-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Everything You Need to Run Your Business
        </motion.h3>
        <motion.p
          className="text-sm sm:text-base md:text-lg text-zinc-400 mb-6 sm:mb-8 md:mb-12 text-center max-w-2xl mx-auto px-4 sm:px-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Complete platform with all the tools coaches need
        </motion.p>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCategory
            title="Client Management"
            description="Manage your coaching roster with comprehensive client profiles and progress tracking"
          >
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Client Profiles
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Add clients, track progress, and organize your roster with
                detailed profiles.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Progress Tracking
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Monitor client development and milestone achievements over time.
              </p>
            </div>
          </FeatureCategory>

          <FeatureCategory
            title="Smart Scheduling"
            description="Automated scheduling system that eliminates back-and-forth coordination"
          >
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Self-Service Booking
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Clients can schedule themselves and swap with other clients
                automatically.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Calendar Integration
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Sync with your existing calendar and avoid double-booking
                conflicts.
              </p>
            </div>
          </FeatureCategory>

          <FeatureCategory
            title="Program Builder"
            description="Create comprehensive training programs with drag-and-drop simplicity"
          >
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Visual Week Builder
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Drag and drop to create weeks, days, and drills with video
                demonstrations.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Template Library
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Access pre-built programs for different skill levels and
                positions.
              </p>
            </div>
          </FeatureCategory>

          <FeatureCategory
            title="Video Analysis"
            description="Professional video coaching with built-in annotation tools"
          >
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Drawing Tools
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Pen, highlight, arrow, circle, and angle measurement tools for
                precise feedback.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Voice Feedback
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Record voice memos directly on video for personalized feedback.
              </p>
            </div>
          </FeatureCategory>

          <FeatureCategory
            title="Unified Messaging"
            description="All communication in one place with professional messaging features"
          >
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Real-Time Chat
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Instant messaging with read receipts and file sharing
                capabilities.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Push Notifications
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Never miss important messages with instant push notifications.
              </p>
            </div>
          </FeatureCategory>

          <FeatureCategory
            title="Resource Library"
            description="Comprehensive resource collection from expert coaches and your own content"
          >
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Expert Content
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Access comprehensive resources from highly intelligent coaches.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                Personal Library
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                Add your own videos and resources for program assignment and
                sharing.
              </p>
            </div>
          </FeatureCategory>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Feature Category
// Simple Feature Card Component
function SimpleFeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
          <p className="text-xs sm:text-sm text-zinc-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCategory({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-zinc-400">{description}</p>
      </div>
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </div>
  );
}

// Animated Feature Showcase Component
function AnimatedFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Program Builder",
      tagline: "Create Once, Use Forever",
      description:
        "Build custom training programs with our intuitive drag-and-drop interface. Create weeks, days, and drills with video demonstrations. Assign to unlimited athletes with 2 clicks.",
      features: [
        "Visual week/day builder",
        "Drag & drop drill ordering",
        "Video library integration",
        "Reusable routine templates",
      ],
      demoType: "programBuilder",
      gradient: "from-sky-500 to-blue-500",
    },
    {
      icon: <Video className="h-8 w-8" />,
      title: "Video Analysis",
      tagline: "Professional Feedback in Minutes",
      description:
        "Provide premium video coaching with built-in annotation tools, voice feedback, and screen recording. Frame-by-frame analysis made simple.",
      features: [
        "Canvas drawing tools",
        "Voice memo feedback",
        "Screen recording",
        "Frame-by-frame playback",
      ],
      demoType: "videoAnalysis",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Unified Messaging",
      tagline: "All Communication in One Place",
      description:
        "Professional messaging system with file sharing, read receipts, and push notifications. Never miss a client message again.",
      features: [
        "Real-time messaging",
        "File attachments",
        "Push notifications",
        "Message history",
      ],
      demoType: "messaging",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Smart Scheduling",
      tagline: "Automate Your Calendar",
      description:
        "Manage lessons, send confirmations, and handle time swap requests. Clients can request changes, and you approve with one click.",
      features: [
        "Visual calendar view",
        "Email confirmations",
        "Time swap requests",
        "Recurring lessons",
      ],
      demoType: "scheduling",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics Dashboard",
      tagline: "Prove Your ROI",
      description:
        "Track client progress, completion rates, and engagement. Show parents the data that justifies renewals and drives business growth.",
      features: [
        "Client progress tracking",
        "Completion rate metrics",
        "Engagement analytics",
        "Exportable reports",
      ],
      demoType: "analytics",
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  // Auto-cycle through features
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % features.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused, features.length]);

  const currentFeature = features[activeIndex];

  const nextFeature = () => {
    setActiveIndex(prev => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setActiveIndex(prev => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="relative" data-reveal>
      {/* Feature Content & Demo */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16 items-center">
        {/* Left Side - Feature Info */}
        <div className="order-2 lg:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Badge */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 sm:px-4 py-1 sm:py-2">
                  <span className="text-xs sm:text-sm text-white font-medium">
                    {currentFeature.tagline}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                {currentFeature.title}
              </h3>

              {/* Description */}
              <p className="text-base sm:text-lg text-zinc-400 mb-6 sm:mb-8">
                {currentFeature.description}
              </p>

              {/* Feature List */}
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {currentFeature.features.map((feature, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-zinc-300"
                  >
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 shrink-0" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <RegisterLink className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:scale-[1.02] w-full sm:w-auto justify-center">
                Get Started
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
              </RegisterLink>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side - Animated Demo */}
        <div className="order-1 lg:order-2">
          <div className="relative">
            {/* Demo Container */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-[4/3] p-4 sm:p-6 lg:p-8"
                >
                  <FeatureDemo type={currentFeature.demoType} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 sm:mt-12 flex items-center justify-center gap-4 sm:gap-8">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={prevFeature}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:border-white/30"
            aria-label="Previous feature"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:border-white/30"
            aria-label={isPaused ? "Resume autoplay" : "Pause autoplay"}
          >
            {isPaused ? (
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </button>

          <button
            onClick={nextFeature}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:border-white/30"
            aria-label="Next feature"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-1 sm:gap-2">
          {features.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="group relative h-1.5 sm:h-2 w-8 sm:w-12 overflow-hidden rounded-full bg-white/10 transition-all hover:bg-white/20"
              aria-label={`Go to feature ${idx + 1}`}
            >
              {idx === activeIndex && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              )}
              {idx < activeIndex && (
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Feature Demo Component
function FeatureDemo({ type }: { type: string }) {
  const demoContent = {
    programBuilder: (
      <div className="h-full flex flex-col gap-3">
        {/* Week tabs */}
        <div className="flex gap-2">
          {["Week 1", "Week 2", "Week 3"].map((week, idx) => (
            <motion.div
              key={week}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                idx === 0
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-white/5 text-zinc-400 border border-white/10"
              }`}
            >
              {week}
            </motion.div>
          ))}
        </div>

        {/* Day cards */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {["Monday", "Tuesday", "Wednesday", "Thursday"].map((day, idx) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="text-sm font-semibold text-white mb-2">{day}</div>
              <div className="space-y-2">
                <div className="h-2 bg-white/20 rounded w-3/4" />
                <div className="h-2 bg-white/20 rounded w-1/2" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    videoAnalysis: (
      <div className="h-full flex flex-col gap-3">
        {/* Video preview matching your actual design */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 rounded-xl bg-zinc-800 border border-white/10 relative overflow-hidden"
          style={{ backgroundColor: "#2A3133" }}
        >
          {/* Video content background - subtle like your app */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-700" />

          {/* Center play button - matches your style */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-3 rounded-full hover:bg-white/20 transition-all duration-200"
              style={{ color: "#ffffff" }}
            >
              <PlayCircle className="h-12 w-12" />
            </motion.button>
          </div>

          {/* Video controls bar - matches your exact style */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6"
            style={{ zIndex: 10 }}
          >
            {/* Progress Bar - matches your design */}
            <input
              type="range"
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider mb-4"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 35%, #4b5563 35%, #4b5563 100%)`,
                zIndex: 20,
              }}
            />

            {/* Control Buttons - matches your exact layout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="p-3 rounded-full hover:bg-white/20 transition-all duration-200">
                  <PlayCircle
                    className="w-5 h-5"
                    style={{ color: "#ffffff" }}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "#ffffff" }}>
                    0:45
                  </span>
                  <span className="text-sm" style={{ color: "#ffffff" }}>
                    /
                  </span>
                  <span className="text-sm" style={{ color: "#ffffff" }}>
                    2:30
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-200">
                  <Volume2 className="w-5 h-5" style={{ color: "#ffffff" }} />
                </button>
                <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-200">
                  <Settings className="w-5 h-5" style={{ color: "#ffffff" }} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Annotation Toolbar - matches your actual toolbar */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 backdrop-blur-md"
            style={{
              backgroundColor: "rgba(26, 26, 26, 0.9)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              zIndex: 40,
            }}
          >
            {/* Tool buttons - matches your exact style */}
            {[
              { icon: Edit3, tool: "pen", active: true },
              { icon: Target, tool: "highlight", active: false },
              { icon: ArrowRight, tool: "arrow", active: false },
              { icon: Target, tool: "circle", active: false },
            ].map(({ icon: Icon, tool, active }, idx) => (
              <motion.button
                key={tool}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  active ? "bg-blue-600 shadow-lg" : "hover:bg-white/10"
                }`}
                title={tool}
              >
                <Icon className="w-5 h-5" style={{ color: "#ffffff" }} />
              </motion.button>
            ))}
          </motion.div>

          {/* Animated annotation overlays - subtle and professional */}
          <motion.svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1 }}
          >
            {/* Pen drawing - matches your red color */}
            <motion.path
              d="M 60 120 Q 100 80 140 60"
              stroke="#ff0000"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Circle annotation */}
            <motion.circle
              cx="140"
              cy="60"
              r="20"
              stroke="#ff0000"
              strokeWidth="2"
              fill="none"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            />
          </motion.svg>
        </motion.div>

        {/* Annotation tools - matches your actual tool palette */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2"
        >
          {[
            { Icon: Edit3, label: "Pen", active: true, color: "#ffffff" },
            { Icon: Mic, label: "Voice", active: false, color: "#ffffff" },
            { Icon: Video, label: "Record", active: false, color: "#ffffff" },
          ].map(({ Icon, label, active, color }, idx) => (
            <motion.button
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className={`p-3 rounded-xl transition-all duration-200 ${
                active ? "bg-blue-600 shadow-lg" : "hover:bg-white/10"
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </motion.button>
          ))}
        </motion.div>
      </div>
    ),
    messaging: (
      <div className="h-full flex flex-col gap-3">
        {/* Message bubbles */}
        {[
          {
            text: "Great progress on your mechanics!",
            sender: "coach",
            delay: 0,
          },
          {
            text: "Thanks! I've been working hard",
            sender: "client",
            delay: 0.2,
          },
          { text: "Here's your new program", sender: "coach", delay: 0.4 },
        ].map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: msg.sender === "coach" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: msg.delay }}
            className={`flex ${msg.sender === "client" ? "justify-end" : ""}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender === "coach"
                  ? "bg-white/10 text-white border border-white/10"
                  : "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-zinc-500"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500">Coach is typing...</span>
        </motion.div>
      </div>
    ),
    scheduling: (
      <div className="h-full flex flex-col gap-3">
        {/* Calendar header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="text-lg font-bold text-white">January 2025</div>
          <div className="flex gap-1">
            <ChevronLeft className="h-5 w-5 text-zinc-400" />
            <ChevronRight className="h-5 w-5 text-zinc-400" />
          </div>
        </motion.div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {Array.from({ length: 28 }).map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              className={`rounded-lg border flex items-center justify-center text-sm ${
                [5, 12, 19].includes(idx)
                  ? "bg-white/20 border-sky-500/30 text-sky-300 font-semibold"
                  : "bg-white/5 border-white/10 text-zinc-400"
              }`}
            >
              {idx + 1}
            </motion.div>
          ))}
        </div>
      </div>
    ),
    analytics: (
      <div className="h-full flex flex-col gap-4">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Active Clients", value: "35", change: "+12%" },
            { label: "Completion Rate", value: "87%", change: "+5%" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-green-400 mt-1">{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Chart bars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 flex items-end gap-2"
        >
          {[65, 82, 75, 90, 85, 95, 88].map((height, idx) => (
            <motion.div
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-sky-500 to-blue-500 rounded-t-lg"
            />
          ))}
        </motion.div>
      </div>
    ),
  };

  return demoContent[type as keyof typeof demoContent] || null;
}
