"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import Image from "next/image";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs";
import {
  ArrowRight,
  Check,
  Trophy,
  Target,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  Video,
  Calendar,
  MessageSquare,
  BarChart3,
  Star,
  CheckCircle2,
  Sparkles,
  PlayCircle,
  X,
  FileText,
  Smartphone,
  Library,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const accountDeleted = searchParams.get("accountDeleted");

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
    <main className="relative -mt-14 overflow-hidden bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
      {/* Account Deleted Success Message */}
      {accountDeleted && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-200" />
              <div>
                <h3 className="font-semibold">Account Deleted Successfully</h3>
                <p className="text-sm text-green-100">
                  You can now register again with the correct role.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />

      {/* HERO - Clear Value Proposition */}
      <section className="relative z-10 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20">
        <MaxWidthWrapper className="text-center px-4 sm:px-6">
          <div data-reveal>
            <h1 className="mx-auto max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight">
              NextLevel Coaching: Scale Your
              <br className="hidden sm:block" />
              <span className="block sm:inline"> </span>
              <span className="text-sky-400">Coaching Business</span>
            </h1>

            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-zinc-300 px-4 sm:px-0">
              Create training programs, analyze videos, and manage clients - all
              in one professional platform.
              <span className="block sm:inline mt-1 sm:mt-0">
                <span className="text-sky-400 font-semibold">
                  Scale from 15 to 50+ athletes
                </span>{" "}
                without the admin headache.
              </span>
            </p>

            {/* Primary CTA */}
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4 sm:flex-row sm:justify-center px-4 sm:px-0">
              <RegisterLink className="group inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-sky-600 hover:scale-[1.02] w-full sm:w-auto justify-center">
                Get Started
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </RegisterLink>
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30 w-full sm:w-auto justify-center">
                <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-400 px-4 sm:px-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span>Easy to use</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="relative mt-16" data-reveal>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
              <Image
                src="/nextls-coming-soon.png"
                alt="NextLS Dashboard - Program builder, client management, and video analysis tools"
                width={1920}
                height={1080}
                priority
                quality={95}
                className="w-full"
              />
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              Your complete coaching dashboard - programs, clients, and video
              analysis in one place
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CORE FEATURES - 4 Key Features */}
      <section className="relative z-10 py-12 sm:py-16 md:py-24 bg-white/[.02]">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div
            className="mx-auto max-w-3xl text-center mb-8 sm:mb-12 md:mb-16"
            data-reveal
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 px-4 sm:px-0">
              Four core features that replace 6+ separate tools
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            <CoreFeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Program Builder"
              benefit="Save 10+ Hours Per Week"
              description="Create comprehensive training programs once, assign to unlimited athletes. Drag-and-drop interface with video demonstrations included."
              features={[
                "Visual week/day builder",
                "Video library integration",
                "Reusable templates",
                "Assign to unlimited athletes",
              ]}
            />
            <CoreFeatureCard
              icon={<Video className="h-8 w-8" />}
              title="Video Analysis"
              benefit="Professional Feedback in Minutes"
              description="Provide premium video coaching with built-in annotation tools, voice feedback, and screen recording capabilities."
              features={[
                "Canvas drawing tools",
                "Voice memo feedback",
                "Frame-by-frame analysis",
                "Share instantly in-app",
              ]}
            />
            <CoreFeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Client Management"
              benefit="Never Miss a Client"
              description="All communication in one place. File sharing, video uploads, progress tracking, and lesson scheduling."
              features={[
                "Unified messaging system",
                "Progress tracking dashboard",
                "Lesson scheduling",
                "File sharing & storage",
              ]}
            />
            <CoreFeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Analytics & Reports"
              benefit="Prove Your Value"
              description="Track client progress, completion rates, and engagement. Show parents the data that justifies premium pricing."
              features={[
                "Client progress metrics",
                "Completion rate tracking",
                "Engagement analytics",
                "Exportable reports",
              ]}
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* RESULTS - ROI + Social Proof Combined */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-sky-950/10 to-transparent">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl text-center mb-16" data-reveal>
            <h2 className="text-4xl font-bold text-white sm:text-5xl mb-4">
              Real Results from Real Coaches
            </h2>
            <p className="text-lg text-zinc-400">
              See how NextLevel Coaching transforms coaching businesses
            </p>
          </div>

          {/* ROI Comparison */}
          <div className="grid gap-8 lg:grid-cols-2 mb-16" data-reveal>
            {/* Before */}
            <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                  <X className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Without NextLevel Coaching
                  </h3>
                  <p className="text-sm text-zinc-400">The old way</p>
                </div>
              </div>
              <div className="space-y-4">
                <ROIItem label="Active Clients" value="12 clients" negative />
                <ROIItem label="Monthly Income" value="$1,800" negative />
                <ROIItem label="Admin Time/Week" value="15 hours" negative />
                <ROIItem label="Client Retention" value="2-3 months" negative />
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-green-500/20 bg-green-950/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    With NextLevel Coaching
                  </h3>
                  <p className="text-sm text-zinc-400">The scalable way</p>
                </div>
              </div>
              <div className="space-y-4">
                <ROIItem
                  label="Active Clients"
                  value="35 clients (+192%)"
                  positive
                />
                <ROIItem
                  label="Monthly Income"
                  value="$6,500 (+261%)"
                  positive
                />
                <ROIItem
                  label="Admin Time/Week"
                  value="5 hours (-67%)"
                  positive
                />
                <ROIItem
                  label="Client Retention"
                  value="9-12 months"
                  positive
                />
              </div>
              <div className="mt-6 pt-6 border-t border-green-500/20">
                <p className="text-sm font-semibold text-green-400">
                  Platform cost: $79/month • ROI: 82x
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid gap-8 md:grid-cols-3" data-reveal>
            <TestimonialCard
              name="Placeholder"
              role="Who"
              quote="I went from 12 clients to 40 in 6 months. NextLevel gave me the tools to scale without hiring help."
              stat="+$4,200/mo"
            />
            <TestimonialCard
              name="Placeholder"
              role="Who"
              quote="The video analysis feature alone saves me 10 hours a week. I can provide better feedback in less time."
              stat="10 hrs saved/week"
            />
            <TestimonialCard
              name="Placeholder"
              role="Who"
              quote="I coach athletes in 5 states now. Before NextLevel, I was limited to local clients."
              stat="5 states served"
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FINAL CTA - Simple and Clear */}
      <section className="relative z-10 py-24">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl text-center" data-reveal>
            <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6">
              Ready to Scale Your Coaching Business?
            </h2>
            <p className="text-xl text-zinc-300 mb-8">
              Join now to transform your coaching business with NextLevel.
            </p>

            <RegisterLink className="group inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-sky-600 hover:scale-[1.02] mb-8">
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </RegisterLink>
          </div>
        </MaxWidthWrapper>
      </section>
    </main>
  );
}

// Core Feature Card Component
function CoreFeatureCard({
  icon,
  title,
  benefit,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  benefit: string;
  description: string;
  features: string[];
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 md:p-8 transition-all hover:bg-white/10 hover:border-sky-500/30"
      data-reveal
    >
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-sky-400">
            {benefit}
          </p>
        </div>
      </div>

      <p className="text-sm sm:text-base text-zinc-400 mb-4 sm:mb-6">
        {description}
      </p>

      <ul className="space-y-1 sm:space-y-2">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300"
          >
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-sky-400 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10">
        <Link
          href="/features"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-sky-400 hover:text-sky-300 transition-colors"
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  benefit,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  benefit: string;
  description: string;
  features: string[];
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-sky-500/30"
      data-reveal
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-sm font-semibold text-sky-400">{benefit}</p>
        </div>
      </div>

      <p className="text-zinc-400 mb-6">{description}</p>

      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className="flex items-center gap-2 text-sm text-zinc-300"
          >
            <Check className="h-4 w-4 text-sky-400 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ROI Item Component
function ROIItem({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={`text-lg font-bold ${
          positive ? "text-green-400" : negative ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({
  name,
  role,
  quote,
  stat,
}: {
  name: string;
  role: string;
  quote: string;
  stat: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10"
      data-reveal
    >
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-zinc-300 mb-6 italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-zinc-400">{role}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-sky-400">{stat}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#2A3133]" />}>
      <HomeContent />
    </Suspense>
  );
}
