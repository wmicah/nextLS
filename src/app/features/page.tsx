"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  Check,
  Users,
  Calendar,
  Video,
  MessageSquare,
  BarChart3,
  Target,
  Brain,
  Zap,
  Shield,
  Smartphone,
  Play,
  Upload,
  TrendingUp,
  Clock,
  FileText,
  Settings,
  Bell,
  Search,
  BookOpen,
  Clipboard,
  Star,
  Rocket,
  Heart,
  Eye,
  Mic,
  Edit3,
  Share2,
  Download,
  Cloud,
  Database,
  Lock,
  Globe,
  Wifi,
  Monitor,
  Laptop,
  Tablet,
  Phone,
  ChevronRight,
  Sparkles,
  Zap,
  Fire,
  Award,
  Medal,
  Trophy,
  Flag,
  MapPin,
  Timer,
  RefreshCw,
  Save,
  Send,
  Plus,
  Minus,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  X as XIcon,
  Search as SearchIcon,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  MoreVertical,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Surprised,
  Confused,
  Wink,
  Kiss,
  Tongue,
  Disappointed,
  Relieved,
  Pensive,
  Worried,
  Expressionless,
  Hushed,
  Sleepy,
  Relieved as RelievedIcon,
  Pensive as PensiveIcon,
  Worried as WorriedIcon,
  Expressionless as ExpressionlessIcon,
  Hushed as HushedIcon,
  Sleepy as SleepyIcon,
  Pause,
  Play as PlayIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-16" style={{ backgroundColor: "#2A3133" }}>
        <MaxWidthWrapper>
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">
                Pitching Coach Platform
              </span>
            </div>

            <h1
              className="text-4xl font-bold mb-6 leading-tight md:text-5xl"
              style={{ color: "#C3BCC2" }}
            >
              The Complete Platform for{" "}
              <span style={{ color: "#4A5A70" }}>
                Softball Pitching Coaches
              </span>
            </h1>

            <p
              className="text-xl mb-12 leading-relaxed max-w-3xl mx-auto"
              style={{ color: "#ABA4AA" }}
            >
              Manage your students, create training programs, schedule lessons,
              and track progress. Everything you need to run a successful
              pitching instruction business.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <RegisterLink
                className="inline-flex items-center rounded-lg px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                style={{ backgroundColor: "#4A5A70" }}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </RegisterLink>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-lg border px-8 py-3 text-lg font-semibold transition-colors hover:opacity-80"
                style={{ borderColor: "#606364", color: "#C3BCC2" }}
              >
                View Pricing
              </Link>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Features Grid */}
      <section className="py-16" style={{ backgroundColor: "#353A3A" }}>
        <MaxWidthWrapper>
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "#C3BCC2" }}
            >
              Everything You Need to Coach Better
            </h2>
            <p className="text-lg" style={{ color: "#ABA4AA" }}>
              Professional tools designed specifically for softball pitching
              coaches
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Client Management */}
            <div
              className="rounded-2xl border p-8 shadow-xl"
              style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                Client Management
              </h3>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                Organize your pitching students with detailed profiles, progress
                tracking, and communication history.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "#ABA4AA" }}>
                <li>• Student profiles and contact info</li>
                <li>• Progress notes and milestones</li>
                <li>• Parent communication logs</li>
                <li>• Easy search and filtering</li>
              </ul>
            </div>

            {/* Training Programs */}
            <div
              className="rounded-2xl border p-8 shadow-xl"
              style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Clipboard className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                Training Programs
              </h3>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                Create structured pitching programs with drills, progressions,
                and skill development tracks.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "#ABA4AA" }}>
                <li>• Multi-week program creation</li>
                <li>• Drill and exercise library</li>
                <li>• Program assignments</li>
                <li>• Completion tracking</li>
              </ul>
            </div>

            {/* Lesson Scheduling */}
            <div
              className="rounded-2xl border p-8 shadow-xl"
              style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Calendar className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                Lesson Scheduling
              </h3>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                Book and manage individual pitching lessons with automatic
                reminders and easy rescheduling.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "#ABA4AA" }}>
                <li>• Calendar management</li>
                <li>• Automatic reminders</li>
                <li>• Cancellation handling</li>
                <li>• Time slot management</li>
              </ul>
            </div>

            {/* Drill Library */}
            <div
              className="rounded-2xl border p-8 shadow-xl"
              style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <BookOpen className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                Drill Library
              </h3>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                Access a comprehensive library of pitching drills, exercises,
                and training videos.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "#ABA4AA" }}>
                <li>• Pitching drill videos</li>
                <li>• Mechanics breakdown</li>
                <li>• Warm-up routines</li>
                <li>• Progressive sequences</li>
              </ul>
            </div>

            {/* Video Analysis */}
            <div
              className="rounded-2xl border p-8 shadow-xl"
              style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Video className="h-6 w-6" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                Video Analysis
              </h3>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                Upload and analyze pitching videos with frame-by-frame breakdown
                and technique feedback.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "#ABA4AA" }}>
                <li>• Video upload and storage</li>
                <li>• Frame-by-frame analysis</li>
                <li>• Technique feedback tools</li>
                <li>• Progress comparison</li>
              </ul>
            </div>

            {/* Communication */}
            <div
              className="rounded-2xl border p-8 shadow-xl"
              style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <MessageSquare
                  className="h-6 w-6"
                  style={{ color: "#C3BCC2" }}
                />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "#C3BCC2" }}
              >
                Communication
              </h3>
              <p className="mb-4" style={{ color: "#ABA4AA" }}>
                Stay connected with students and parents through direct
                messaging and updates.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "#ABA4AA" }}>
                <li>• Direct messaging</li>
                <li>• Parent communication</li>
                <li>• Lesson updates</li>
                <li>• Performance feedback</li>
              </ul>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Benefits Section */}
      <section className="py-16" style={{ backgroundColor: "#2A3133" }}>
        <MaxWidthWrapper>
          <div className="text-center mb-16">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "#C3BCC2" }}
            >
              Why Pitching Coaches Choose Us
            </h2>
            <p className="text-lg" style={{ color: "#ABA4AA" }}>
              Built specifically for softball pitching instruction
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Target className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Pitching Focused
              </h3>
              <p style={{ color: "#ABA4AA" }}>
                Designed specifically for softball pitching coaches
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Clock className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Save Time
              </h3>
              <p style={{ color: "#ABA4AA" }}>
                Streamline your coaching business and focus on teaching
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <TrendingUp className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Grow Your Business
              </h3>
              <p style={{ color: "#ABA4AA" }}>
                Manage more students and build your reputation
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <Shield className="h-8 w-8" style={{ color: "#C3BCC2" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Professional
              </h3>
              <p style={{ color: "#ABA4AA" }}>
                Look professional and organized to parents and students
              </p>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: "#4A5A70" }}>
        <MaxWidthWrapper>
          <div className="text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to take your pitching instruction to the next level?
              </h2>
              <p className="text-xl mb-8" style={{ color: "#C3BCC2" }}>
                Join pitching coaches who are using our platform to develop
                better pitchers and grow their coaching business.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <RegisterLink className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-lg font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </RegisterLink>
                <Link
                  href="/pricing"
                  className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-8 py-3 text-lg font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  View Pricing
                </Link>
              </div>

              <div
                className="mt-6 flex items-center justify-center gap-6 text-sm"
                style={{ color: "#C3BCC2" }}
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-300" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-300" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-300" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  );
}
