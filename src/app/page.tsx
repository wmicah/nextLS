"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Users,
  Video,
  Calendar,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  PlayCircle,
  Target,
  Trophy,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

function HomeContent() {
  const searchParams = useSearchParams();
  const accountDeleted = searchParams.get("accountDeleted");

  // Scroll reveal animation
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    els.forEach(el => {
      el.classList.add(
        "opacity-0",
        "translate-y-8",
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
            el.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => {
      els.forEach(el => io.unobserve(el));
      io.disconnect();
    };
  }, []);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NextLevel Coaching",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Athletes train free. Coaches pay monthly.",
    },
    description:
      "Professional sports coaching platform for coaches and athletes to manage clients, create programs, track progress, and grow coaching businesses.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    featureList: [
      "Program Builder",
      "Client Management",
      "Lesson Scheduling",
      "Video Analysis",
      "Progress Tracking",
      "Team Collaboration",
    ],
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NextLevel Coaching",
    url: "https://nxlvlcoach.com",
    logo: "https://nxlvlcoach.com/logo.png",
    description:
      "Professional sports coaching platform trusted by elite coaches to build championship programs and develop athletes.",
    sameAs: [
      "https://twitter.com/nextlevelcoaching",
      "https://www.facebook.com/nextlevelcoaching",
    ],
  };

  return (
    <main className="relative -mt-14 overflow-hidden bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />

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

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 md:pb-24 bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <MaxWidthWrapper className="px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                <motion.span
                  className="text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Elevate Your
                </motion.span>
                <br />
                <motion.span
                  className="text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Coaching Game
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-8 leading-relaxed max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                The professional platform trusted by elite coaches to build
                championship programs, develop athletes, and grow their
                business.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              >
                <RegisterLink className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:scale-[1.02]">
                  Get Started
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </RegisterLink>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30">
                  <PlayCircle className="h-5 w-5" />
                  Watch Demo
                </button>
              </motion.div>
              <motion.div
                className="flex flex-wrap items-center gap-6 text-sm text-zinc-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              >
                {[
                  "Athletes train free",
                  "Coaches pay monthly",
                  "Cancel anytime",
                ].map((text, idx) => (
                  <motion.div
                    key={text}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.7 + idx * 0.1,
                      ease: "easeOut",
                    }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                    <span>{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Side - Device Mockup */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              <DeviceMockup />
            </motion.div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* HOW IT WORKS - Video Format Steps */}
      <section className="py-16 sm:py-20 md:py-24 bg-white/[.02]">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="text-center mb-16" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <VideoStepPlayer />
        </MaxWidthWrapper>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-16 sm:py-20 md:py-24 bg-transparent">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="text-center mb-16" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Built for Champions
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Whether you're a coach, athlete, or team, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <WhoCard
              title="For Coaches"
              description="Scale your coaching business, manage multiple athletes, and deliver professional training programs that get results."
              features={[
                "Program builder & templates",
                "Client management system",
                "Video analysis tools",
                "Progress tracking & analytics",
              ]}
              imagePlaceholder="Coach working with athletes"
            />
            <WhoCard
              title="For Athletes"
              description="Access your personalized training programs, submit videos for feedback, and track your progress toward your goals."
              features={[
                "Personalized programs",
                "Video submission & feedback",
                "Progress dashboard",
                "Direct coach communication",
              ]}
              imagePlaceholder="Athlete training"
            />
            <WhoCard
              title="For Teams"
              description="Organize team training, share resources, and coordinate multiple coaches working with the same athletes."
              features={[
                "Multi-coach support",
                "Shared program library",
                "Team analytics",
                "Unified communication",
              ]}
              imagePlaceholder="Team training session"
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CORE FEATURES - With Sporty Visuals */}
      <section className="py-16 sm:py-20 md:py-24 bg-white/[.02]">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="text-center mb-16" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Professional tools designed for serious coaches and athletes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <FeatureCard
              title="Program Builder"
              description="Create comprehensive training programs with our intuitive visual builder. Add drills, exercises, videos, and coaching instructions."
              imagePlaceholder="Program builder interface"
            />
            <FeatureCard
              title="Video Analysis"
              description="Provide professional video feedback with annotation tools, voice notes, and frame-by-frame analysis. Help athletes perfect their technique."
              imagePlaceholder="Video analysis tools"
            />
            <FeatureCard
              title="Client Management"
              description="Manage all your athletes in one place. Track progress, schedule lessons, communicate, and share resources seamlessly."
              imagePlaceholder="Client management dashboard"
            />
            <FeatureCard
              title="Analytics & Insights"
              description="Track completion rates, engagement metrics, and progress over time. Show parents and athletes the value of your coaching."
              imagePlaceholder="Analytics dashboard"
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center text-white" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Take Your Coaching to the Next Level?
            </h2>
            <p className="text-xl mb-8 opacity-95">
              Join hundreds of coaches who are already transforming their
              businesses and helping athletes reach their full potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RegisterLink className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:scale-[1.02]">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </RegisterLink>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

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

// Video Step Player Component - GitHub Style with Animated Demos
function VideoStepPlayer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      number: "01",
      title: "Create Your Program",
      description:
        "Build comprehensive training programs with our visual builder. Add drills, videos, and coaching notes in minutes.",
      overlay: "Program Builder",
    },
    {
      number: "02",
      title: "Assign to Athletes",
      description:
        "Share programs instantly with your athletes. Track progress, completion rates, and engagement in real-time.",
      overlay: "Client Management",
    },
    {
      number: "03",
      title: "Schedule & Manage",
      description:
        "Schedule lessons and workouts with your clients. Manage availability, handle rescheduling, and keep everyone organized.",
      overlay: "Scheduling System",
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 5000); // Change step every 9 seconds

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const currentStepData = steps[currentStep];

  return (
    <div className="w-full" data-reveal>
      {/* Large Video Container - GitHub Style */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/10 border border-white/10 shadow-2xl">
        {/* Video/Content Area */}
        <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
          {/* Animated Demo Content */}
          <div className="absolute inset-0 p-6 md:p-8">
            {/* Step 1: Program Builder */}
            {currentStep === 0 && <ProgramBuilderDemo />}

            {/* Step 2: Client Management */}
            {currentStep === 1 && <ClientManagementDemo />}

            {/* Step 3: Scheduling */}
            {currentStep === 2 && <SchedulingDemo />}

            {/* Overlay Badge */}
            <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 z-20">
              <span className="text-white text-sm font-medium">
                {currentStepData.overlay}
              </span>
            </div>
          </div>

          {/* Fade transition overlay */}
          <div
            key={currentStep}
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
            style={{
              animation: "fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "opacity",
            }}
          />
        </div>

        {/* Content Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wider">
              Step {currentStepData.number}
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {currentStepData.title}
            </h3>
            <p className="text-lg text-zinc-300 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>
        </div>

        {/* Play/Pause Control - Top Right */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all z-10"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-white rounded-full"></div>
              <div className="w-1 h-4 bg-white rounded-full"></div>
            </div>
          ) : (
            <PlayCircle className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* Step Navigation - Below Video */}
      <div className="mt-8 flex items-center justify-between">
        {/* Step Dots */}
        <div className="flex items-center gap-3">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index);
                setIsPlaying(false);
              }}
              className={`relative transition-all ${
                index === currentStep ? "w-12" : "w-3 hover:w-6"
              } h-3 rounded-full ${
                index === currentStep
                  ? "bg-white"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to step ${index + 1}`}
            >
              {index === currentStep && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-white whitespace-nowrap">
                  {step.title}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentStep(prev => (prev - 1 + steps.length) % steps.length);
              setIsPlaying(false);
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            ← Previous
          </button>
          <button
            onClick={() => {
              setCurrentStep(prev => (prev + 1) % steps.length);
              setIsPlaying(false);
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// Program Builder Demo Component
function ProgramBuilderDemo() {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const days = [
    {
      label: "Sunday",
      drills: ["Warm-up Routine", "Arm Circle Drills", "Leg Drive Focus"],
    },
    {
      label: "Monday",
      drills: ["Mechanics", "Release Point Work", "Follow Through"],
    },
    { label: "Tuesday", drills: ["Rest Day"] },
    {
      label: "Wednesday",
      drills: ["Speed Training", "Spin Rate Work", "Location Practice"],
    },
    { label: "Thursday", drills: ["Changeup Development", "Movement Drills"] },
    { label: "Friday", drills: ["Bullpen Session", "Video Review"] },
    { label: "Saturday", drills: ["Game Simulation", "Mental Prep"] },
  ];

  return (
    <div className="h-full w-full bg-[#353A3A] rounded-xl border border-white/10 p-4 md:p-6 relative overflow-hidden">
      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#2A3133] border-r border-white/10"></div>

      {/* Main Content */}
      <div className="ml-20 h-full flex flex-col">
        {/* Header */}
        <div className="h-12 bg-white/5 rounded-lg mb-4 flex items-center px-4 border border-white/10">
          <div className="text-white font-semibold">Your Program - Week 1</div>
        </div>

        {/* Week/Day Structure */}
        <div className="flex-1 grid grid-cols-7 gap-2">
          {days.map((day, idx) => (
            <div
              key={day.label}
              className="bg-white/5 rounded-lg border border-white/10 p-3 relative overflow-hidden"
              style={{
                animationDelay: `${idx * 100}ms`,
                animation:
                  animationStep >= idx
                    ? "slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                    : "none",
                willChange: "transform, opacity",
              }}
            >
              <div className="text-xs text-zinc-400 mb-2 font-medium">
                {day.label.substring(0, 3)}
              </div>
              {animationStep > idx && day.drills[0] !== "Rest Day" ? (
                <div className="space-y-1.5">
                  {day.drills.slice(0, 3).map((drill, drillIdx) => (
                    <div
                      key={drillIdx}
                      className="text-xs text-white/80 bg-white/5 rounded px-2 py-1 border border-white/10"
                      style={{
                        animationDelay: `${idx * 100 + drillIdx * 50}ms`,
                        animation:
                          animationStep > idx
                            ? "fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                            : "none",
                        willChange: "transform, opacity",
                      }}
                    >
                      {drill}
                    </div>
                  ))}
                </div>
              ) : animationStep > idx ? (
                <div className="text-xs text-zinc-500 italic">Rest Day</div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex gap-2">
          <div className="h-10 w-28 bg-white/10 rounded-lg flex items-center justify-center text-sm text-white border border-white/20">
            Save Program
          </div>
          <div className="h-10 w-28 bg-white/10 rounded-lg flex items-center justify-center text-sm text-white border border-white/20">
            Add Week
          </div>
        </div>
      </div>
    </div>
  );
}

// Client Management Demo Component
function ClientManagementDemo() {
  const clients = [
    {
      name: "Sarah Mitchell",
      initials: "SM",
      nextLesson: "Jan 15, 3:00 PM",
      progress: 78,
      programs: 2,
      status: "Active",
    },
    {
      name: "Michael Chen",
      initials: "MC",
      nextLesson: "Jan 16, 10:00 AM",
      progress: 65,
      programs: 1,
      status: "Active",
    },
    {
      name: "Jessica Rodriguez",
      initials: "JR",
      nextLesson: "Jan 14, 4:30 PM",
      progress: 92,
      programs: 3,
      status: "Active",
    },
    {
      name: "Alex Thompson",
      initials: "AT",
      nextLesson: "Jan 17, 2:00 PM",
      progress: 45,
      programs: 1,
      status: "Active",
    },
  ];

  return (
    <div className="h-full w-full bg-[#353A3A] rounded-xl border border-white/10 p-4 md:p-6 relative overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-white/5 rounded-lg mb-4 flex items-center justify-between px-4 border border-white/10">
        <div className="text-white font-semibold text-lg">Your Athletes</div>
        <div className="h-8 w-32 bg-white/10 rounded-lg flex items-center justify-center text-sm text-white border border-white/20">
          + Add Client
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-2 gap-4">
        {clients.map((client, idx) => (
          <div
            key={client.name}
            className="bg-white/5 rounded-lg border border-white/10 p-4"
            style={{
              animationDelay: `${idx * 100}ms`,
              animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#4A5A70] flex items-center justify-center text-white font-bold text-sm">
                {client.initials}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  {client.name}
                </div>
                <div className="text-xs text-zinc-400">
                  Next: {client.nextLesson}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Progress</span>
                <span className="text-white font-medium">
                  {client.progress}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#09C4F2] rounded-full"
                  style={{ width: `${client.progress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="text-zinc-400">
                  {client.programs} program{client.programs > 1 ? "s" : ""}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-green-400">{client.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Scheduling Demo Component
function SchedulingDemo() {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  const scheduleItems = [
    {
      time: "9:00 AM",
      client: "Sarah Mitchell",
      type: "Lesson",
      status: "Confirmed",
    },
    {
      time: "10:00 AM",
      client: "Michael Chen",
      type: "Workout",
      status: "Confirmed",
    },
    {
      time: "11:00 AM",
      client: "Jessica Rodriguez",
      type: "Lesson",
      status: "Pending",
    },
    {
      time: "2:00 PM",
      client: "Alex Thompson",
      type: "Lesson",
      status: "Confirmed",
    },
    {
      time: "3:00 PM",
      client: "Sarah Mitchell",
      type: "Video Review",
      status: "Confirmed",
    },
  ];

  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDay = dayNames[today.getDay()];

  return (
    <div className="h-full w-full bg-[#353A3A] rounded-xl border border-white/10 p-4 md:p-6 relative overflow-hidden">
      {/* Calendar Header */}
      <div className="h-12 bg-white/5 rounded-lg mb-4 flex items-center justify-between px-4 border border-white/10">
        <div className="text-white font-semibold">January 2025</div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/20 cursor-pointer">
            ←
          </div>
          <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/20 cursor-pointer">
            →
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day, idx) => (
          <div
            key={day}
            className={`text-center text-xs py-2 rounded ${
              day === currentDay
                ? "bg-[#09C4F2]/20 text-[#09C4F2] font-semibold"
                : "text-zinc-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Time Slots */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {scheduleItems.map((item, idx) => (
          <div
            key={item.time}
            className="bg-white/5 rounded-lg border border-white/10 p-3 flex items-center justify-between"
            style={{
              animationDelay: `${idx * 150}ms`,
              animation:
                animationStep >= idx
                  ? "slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                  : "none",
              willChange: "transform, opacity",
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-20 text-sm text-zinc-300 font-medium">
                {item.time}
              </div>
              {animationStep > idx && (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#4A5A70] flex items-center justify-center text-white text-xs font-bold">
                    {item.client
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {item.client}
                    </div>
                    <div className="text-xs text-zinc-400">{item.type}</div>
                  </div>
                </>
              )}
            </div>
            {animationStep > idx && (
              <div
                className={`px-3 py-1 rounded text-xs font-medium ${
                  item.status === "Confirmed"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                }`}
              >
                {item.status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Who Card Component
function WhoCard({
  title,
  description,
  features,
  imagePlaceholder,
}: {
  title: string;
  description: string;
  features: string[];
  imagePlaceholder: string;
}) {
  const isTeamCard = title === "For Teams";
  const isCoachCard = title === "For Coaches";
  const isAthleteCard = title === "For Athletes";

  return (
    <div
      className="bg-white/5 rounded-2xl shadow-lg overflow-hidden border border-white/10"
      data-reveal
    >
      <div className="relative aspect-[16/10] bg-[#353A3A] border-b border-white/10 overflow-hidden">
        {isTeamCard ? (
          <TeamWorkspaceDemo />
        ) : isCoachCard ? (
          <CoachDashboardDemo />
        ) : isAthleteCard ? (
          <AthleteDashboardDemo />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-400 text-sm font-medium">
              {imagePlaceholder}
            </p>
          </div>
        )}
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-zinc-300 mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Device Mockup Component for Hero
function DeviceMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Laptop Frame */}
      <div className="relative">
        {/* Screen Bezel */}
        <div className="bg-[#1a1a1a] rounded-t-lg p-1.5 shadow-2xl">
          {/* Screen */}
          <div className="bg-[#2A3133] rounded overflow-hidden border border-white/10">
            {/* Browser Bar */}
            <div className="bg-[#1a1a1a] px-3 py-2 flex items-center gap-2 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="flex-1 bg-[#2A3133] rounded px-3 py-1 mx-2">
                <div className="text-[10px] text-zinc-500">
                  nxlvlcoach.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-3 bg-[#2A3133] min-h-[450px]">
              <div className="flex gap-3 h-full">
                {/* Sidebar */}
                <motion.div
                  className="w-14 bg-[#353A3A] rounded-lg p-2 flex flex-col items-center gap-2 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-8 h-8 bg-white/10 rounded mb-2"></div>
                  <div className="space-y-1.5 flex-1 w-full">
                    <div className="w-full h-8 bg-white/10 rounded border border-white/20"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                  </div>
                  <div className="w-8 h-8 bg-white/5 rounded"></div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <motion.div
                    className="mb-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-lg font-bold text-white mb-1">
                      Welcome back, Coach
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Monday, January 15, 2025
                    </p>
                  </motion.div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Active Clients", value: 12 },
                      { label: "Programs", value: 8 },
                      { label: "Today's Lessons", value: 5 },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        className="bg-white/5 rounded-lg p-2.5 border border-white/10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.3 + idx * 0.1,
                        }}
                      >
                        <div className="text-xs text-zinc-400 mb-1">
                          {stat.label}
                        </div>
                        <motion.div
                          className="text-xl font-bold text-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.5,
                            delay: 0.5 + idx * 0.1,
                          }}
                        >
                          {stat.value}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Week at a Glance */}
                  <motion.div
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white">
                        Week at a Glance
                      </h3>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-white/10 rounded"></div>
                        <div className="w-4 h-4 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 mb-2">
                      Jan 13 - Jan 19, 2025
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => {
                        const dayNum = 13 + idx;
                        const isToday = dayNum === 15;
                        const hasEvent = [14, 15, 16, 18].includes(dayNum);
                        return (
                          <motion.div
                            key={idx}
                            className={`text-center p-1 rounded border ${
                              isToday
                                ? "bg-white/10 border-white/30"
                                : "bg-white/5 border-white/10"
                            }`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.7 + idx * 0.05,
                            }}
                          >
                            <div className="text-[9px] text-zinc-400 mb-0.5">
                              {day}
                            </div>
                            <div className="text-[10px] font-medium text-zinc-300">
                              {dayNum}
                            </div>
                            {hasEvent && (
                              <motion.div
                                className="h-1 bg-white/20 rounded mt-1"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{
                                  duration: 0.3,
                                  delay: 0.9 + idx * 0.05,
                                }}
                              />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    <motion.div
                      className="text-[10px] text-zinc-400 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.1 }}
                    >
                      12 events this week
                    </motion.div>
                  </motion.div>

                  {/* Bottom Row - Notifications & Schedule */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Recent Notifications */}
                    <motion.div
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">
                          Recent Notifications
                        </h3>
                        <span className="text-[10px] text-zinc-400">
                          View All
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[
                          "New video submission from Alex Thompson",
                          "Program completed by Sarah Mitchell",
                        ].map((notification, idx) => (
                          <motion.div
                            key={idx}
                            className="text-[10px] text-zinc-300"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: 0.9 + idx * 0.15,
                            }}
                          >
                            {notification}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Today's Schedule */}
                    <motion.div
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <h3 className="text-sm font-semibold text-white mb-2">
                        Today's Schedule
                      </h3>
                      <div className="space-y-1.5">
                        {[
                          "2:00 PM - Alex Thompson",
                          "4:00 PM - Sarah Mitchell",
                          "6:00 PM - Michael Chen",
                        ].map((schedule, idx) => (
                          <motion.div
                            key={idx}
                            className="flex items-center gap-2 text-[10px]"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: 0.9 + idx * 0.15,
                            }}
                          >
                            <motion.div
                              className="w-1.5 h-1.5 bg-white/30 rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                duration: 0.3,
                                delay: 1 + idx * 0.15,
                              }}
                            />
                            <span className="text-zinc-300">{schedule}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Base */}
        <div className="bg-[#1a1a1a] h-2 rounded-b-lg shadow-2xl"></div>
        <div className="bg-[#0f0f0f] h-1 rounded-b-lg mx-8"></div>
      </div>
    </div>
  );
}

// Athlete Dashboard Demo Component
function AthleteDashboardDemo() {
  return (
    <div className="h-full w-full flex flex-col bg-[#2A3133] p-2 text-xs">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="w-24 h-4 bg-white/10 rounded"></div>
        <div className="flex gap-1.5">
          <div className="w-4 h-4 bg-white/10 rounded"></div>
          <div className="w-4 h-4 bg-white/10 rounded"></div>
          <div className="w-4 h-4 bg-white/10 rounded"></div>
          <div className="w-6 h-6 bg-white/10 rounded-full"></div>
        </div>
      </div>

      {/* Widget Cards */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {/* Upcoming Lessons */}
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="w-16 h-3 bg-white/10 rounded mb-1"></div>
          <div className="w-full h-2.5 bg-white/10 rounded"></div>
        </div>

        {/* Coach Notes */}
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="w-14 h-3 bg-white/10 rounded mb-1"></div>
          <div className="w-full h-2.5 bg-white/10 rounded"></div>
        </div>

        {/* Message Coach */}
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="w-18 h-3 bg-white/10 rounded mb-1"></div>
          <div className="h-4 bg-white/10 rounded"></div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 bg-[#353A3A] rounded-lg p-2 border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <div className="w-20 h-3 bg-white/10 rounded"></div>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-white/10 rounded"></div>
            <div className="w-3 h-3 bg-white/10 rounded"></div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div key={idx} className="text-[9px] text-zinc-400 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 14 }, (_, i) => {
            const day = i + 13;
            const hasActivity = [15, 17, 19, 21, 23].includes(day);
            const isRestDay = day === 16;
            const isToday = day === 18;

            return (
              <div
                key={day}
                className={`aspect-square p-0.5 rounded ${
                  isToday
                    ? "bg-white/10 border border-white/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="text-[9px] text-zinc-300 mb-0.5">{day}</div>
                {hasActivity && (
                  <div className="h-2 bg-white/20 rounded text-[7px] text-white flex items-center justify-center">
                    {day % 2 === 0 ? "Workout" : "Training"}
                  </div>
                )}
                {isRestDay && (
                  <div className="h-2 bg-white/20 rounded text-[7px] text-white flex items-center justify-center">
                    Rest
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Coach Dashboard Demo Component
function CoachDashboardDemo() {
  return (
    <div className="h-full w-full flex bg-[#2A3133] p-2 text-xs">
      {/* Left Sidebar */}
      <div className="w-16 bg-[#353A3A] rounded-lg mr-2 flex flex-col items-center py-3 border border-white/10">
        <div className="w-6 h-6 bg-white/10 rounded mb-3"></div>
        <div className="space-y-2 flex-1">
          <div className="w-6 h-6 bg-white/10 rounded border border-white/20"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
        </div>
        <div className="w-6 h-6 bg-white/5 rounded"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#353A3A] rounded-lg p-3 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-white mb-0.5">
              Welcome back, Coach
            </div>
            <div className="text-[10px] text-zinc-400">Jan 15, 2025</div>
          </div>
        </div>

        {/* Week at a Glance */}
        <div className="bg-white/5 rounded p-2 border border-white/10 mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-semibold text-white">
              Week at a Glance
            </div>
            <div className="text-[10px] text-zinc-400">Jan 13 - Jan 19</div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
              <div
                key={idx}
                className={`text-center p-1 rounded border ${
                  idx === 4
                    ? "bg-white/10 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-zinc-400"
                }`}
              >
                <div className="text-[9px]">{day}</div>
                <div className="text-[10px] font-medium">{13 + idx}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-zinc-400">12 events this week</div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-white/5 rounded p-1.5 border border-white/10">
            <div className="text-xs font-bold text-white mb-0.5">12</div>
            <div className="text-[9px] text-zinc-400">Active Clients</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-white/10">
            <div className="text-xs font-bold text-white mb-0.5">8</div>
            <div className="text-[9px] text-zinc-400">Programs</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 border border-white/10">
            <div className="text-xs font-bold text-white mb-0.5">5</div>
            <div className="text-[9px] text-zinc-400">Today's Lessons</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <div className="text-xs font-semibold text-white mb-1.5">
            Recent Activity
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-300">
              New video submission from Alex Thompson
            </div>
            <div className="text-[10px] text-zinc-300">
              Program completed by Sarah Mitchell
            </div>
            <div className="text-[10px] text-zinc-300">
              Lesson scheduled for tomorrow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Team Workspace Demo Component
function TeamWorkspaceDemo() {
  return (
    <div className="h-full w-full flex bg-[#2A3133] p-2 text-xs">
      {/* Left Sidebar */}
      <div className="w-16 bg-[#353A3A] rounded-lg mr-2 flex flex-col items-center py-3 border border-white/10">
        <div className="w-6 h-6 bg-white/10 rounded mb-3"></div>
        <div className="space-y-2 flex-1">
          <div className="w-6 h-6 bg-white/10 rounded border border-white/20"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
          <div className="w-6 h-6 bg-white/5 rounded"></div>
        </div>
        <div className="w-6 h-6 bg-white/5 rounded"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#353A3A] rounded-lg p-3 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-4 bg-white/10 rounded"></div>
            <div className="h-4 w-24 bg-white/10 rounded"></div>
          </div>
          <div className="text-[10px] text-zinc-400">
            <span>3 / 5 coaches</span>
            <span className="mx-1">•</span>
            <span>42 / 250 clients</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/5 rounded p-2 border border-white/10">
            <div className="text-lg font-bold text-white mb-0.5">3</div>
            <div className="text-[10px] text-zinc-400">Coaches • Max: 5</div>
          </div>
          <div className="bg-white/5 rounded p-2 border border-white/10">
            <div className="text-lg font-bold text-white mb-0.5">42</div>
            <div className="text-[10px] text-zinc-400">Clients • Max: 250</div>
          </div>
          <div className="bg-white/5 rounded p-2 border border-white/10">
            <div className="text-lg font-bold text-white mb-0.5">2</div>
            <div className="text-[10px] text-zinc-400">Shared Programs</div>
          </div>
          <div className="bg-white/5 rounded p-2 border border-white/10">
            <div className="text-lg font-bold text-white mb-0.5">5</div>
            <div className="text-[10px] text-zinc-400">Shared Routines</div>
          </div>
        </div>

        {/* Team Members */}
        <div className="mb-2">
          <div className="text-xs font-semibold text-white mb-1.5">
            Team Members
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 bg-white/5 rounded p-1.5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-[#4A5A70] flex items-center justify-center text-white text-[10px] font-bold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-white mb-0.5">
                  John Davis
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  john.davis@example.com
                </div>
              </div>
              <div className="h-5 px-2 bg-white/10 rounded flex items-center border border-white/20">
                <span className="text-[9px] text-zinc-300 font-medium">
                  OWNER
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded p-1.5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-[#4A5A70] flex items-center justify-center text-white text-[10px] font-bold">
                MS
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-white mb-0.5">
                  Maria Smith
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  maria.smith@example.com
                </div>
              </div>
              <div className="h-5 px-2 bg-white/10 rounded flex items-center border border-white/20">
                <span className="text-[9px] text-zinc-300 font-medium">
                  COACH
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shared Resources */}
        <div>
          <div className="text-xs font-semibold text-white mb-1.5">
            Shared Resources
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="text-[10px] text-zinc-400 mb-1">
                No shared programs yet
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white mb-1">Routines (5)</div>
              <div className="space-y-0.5 pl-2">
                <div className="text-[10px] text-zinc-300">
                  Advanced Pitching Routine
                </div>
                <div className="text-[9px] text-zinc-500">
                  Created by John Davis
                </div>
                <div className="text-[10px] text-zinc-300">
                  Speed Development
                </div>
                <div className="text-[9px] text-zinc-500">
                  Created by Maria Smith
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  title,
  description,
  imagePlaceholder,
}: {
  title: string;
  description: string;
  imagePlaceholder: string;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center" data-reveal>
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-zinc-300 leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-zinc-400 text-sm font-medium">
            {imagePlaceholder}
          </p>
        </div>
        {/* Replace with actual image */}
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
