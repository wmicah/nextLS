"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, PlayCircle } from "lucide-react";
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
        {/* Subtle background elements - not too flashy */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-[#E5B232]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <MaxWidthWrapper className="px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Simple badge - not flashy */}
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E5B232]/10 border border-[#E5B232]/20 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="w-2 h-2 rounded-full bg-[#E5B232]"></div>
                <span className="text-sm text-[#E5B232] font-medium">
                  Built by coaches, for coaches
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                <span className="text-white">Your Athletes</span>
                <br />
                <span className="text-white">Deserve </span>
                <span className="text-[#E5B232]">Better</span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-zinc-400 mb-8 leading-relaxed max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                The platform that lets you focus on what you do best—
                <span className="text-white font-medium">coaching</span>. Build
                programs, manage athletes, analyze video, and schedule lessons.
                All in one place.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                <RegisterLink className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#E5B232] px-8 py-4 text-lg font-semibold text-[#1a1f20] transition-all hover:bg-[#F5C242] hover:shadow-lg hover:shadow-[#E5B232]/20">
                  Start Coaching
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </RegisterLink>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-6 text-sm text-zinc-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                {[
                  "Athletes train free",
                  "Starting at $25/month",
                  "Cancel anytime",
                ].map((text, idx) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                    <span>{text}</span>
                  </div>
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

      {/* SCROLLING REVIEWS MARQUEE */}
      <ReviewsMarquee />

      {/* HOW IT WORKS - Interactive Demo Section */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20 md:py-24 bg-white/[.02]"
      >
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Watch how coaches use NextLevel to run their entire business
            </p>
          </div>

          <VideoStepPlayer />
        </MaxWidthWrapper>
      </section>

      {/* WHO IT'S FOR - Real coaching scenarios */}
      <section className="py-16 sm:py-20 md:py-24 bg-transparent">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Built for Real Coaches
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Whether you're training one athlete or managing a full academy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            <WhoCard
              title="For Coaches"
              description="Manage your athletes, create training programs, and deliver professional coaching without the administrative headache."
              features={[
                "Visual program builder",
                "Client profiles & progress",
                "Video analysis tools",
                "Scheduling & reminders",
              ]}
            />
            <WhoCard
              title="For Athletes"
              description="Access your training programs, submit videos for feedback, track your progress, and communicate directly with your coach."
              features={[
                "Personalized programs",
                "Video submission",
                "Progress tracking",
                "Direct messaging",
              ]}
            />
            <WhoCard
              title="For Teams"
              description="Coordinate multiple coaches, share resources across your organization, and maintain training consistency."
              features={[
                "Multi-coach support",
                "Shared program library",
                "Team-wide analytics",
                "Unified communication",
              ]}
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FEATURES - Interactive Bento Grid */}
      <section className="py-16 sm:py-20 md:py-24 bg-white/[.02]">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-16" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Professional tools that work together seamlessly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <FeatureCard
              title="Program Builder"
              description="Create comprehensive training programs with weeks, days, and drills"
              visual={<ProgramBuilderMini />}
              delay={0}
            />
            <FeatureCard
              title="Video Analysis"
              description="Frame-by-frame breakdown with annotation tools and voice feedback"
              visual={<VideoAnalysisMini />}
              delay={0.1}
            />
            <FeatureCard
              title="Client Management"
              description="All your athletes in one place with progress tracking"
              visual={<ClientManagementMini />}
              delay={0.2}
            />
            <FeatureCard
              title="Smart Scheduling"
              description="Athletes book available slots with automatic reminders"
              visual={<SchedulingMini />}
              delay={0.3}
            />
            <FeatureCard
              title="Messaging"
              description="Real-time chat with file sharing and read receipts"
              visual={<MessagingMini />}
              delay={0.4}
            />
            <FeatureCard
              title="Analytics"
              description="Track completion rates, engagement, and show your value"
              visual={<AnalyticsMini />}
              delay={0.5}
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FINAL CTA - Direct and simple */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
        <MaxWidthWrapper className="px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Focus on Coaching?
            </h2>
            <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
              Join coaches who've simplified their business and improved their
              athletes' results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <RegisterLink className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#E5B232] px-8 py-4 text-lg font-semibold text-[#1a1f20] transition-all hover:bg-[#F5C242] hover:shadow-lg hover:shadow-[#E5B232]/20">
                Get Started Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </RegisterLink>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
            <p className="text-sm text-zinc-500">
              Athletes always free • Starting at $25/month
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FOOTER - Clean and professional */}
      <footer className="border-t border-white/10 bg-[#1a1f20]">
        <MaxWidthWrapper className="px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold text-white mb-4">NextLevel</h3>
              <p className="text-sm text-zinc-500 mb-4 max-w-xs">
                The coaching platform built for coaches who want to spend more
                time coaching.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/features"
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <RegisterLink className="text-zinc-500 hover:text-white transition-colors text-sm">
                    Get Started
                  </RegisterLink>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">
              © {new Date().getFullYear()} NextLevel Coaching. All rights
              reserved.
            </p>
            <span className="text-zinc-600 text-sm">
              Powered by{" "}
              <Link
                href="https://nexishq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors font-medium"
              >
                Nexis
              </Link>
            </span>
          </div>
        </MaxWidthWrapper>
      </footer>
    </main>
  );
}

// ============================================
// REVIEWS MARQUEE - Placeholder testimonials (no fake reviews)
// ============================================
function ReviewsMarquee() {
  const placeholders = [
    {
      text: "Your review or testimonial could appear here.",
      author: "Your name",
      role: "Coach",
    },
    {
      text: "Share what you like about NextLevel Coaching.",
      author: "Your name",
      role: "Coach",
    },
    {
      text: "We're collecting feedback from coaches like you.",
      author: "—",
      role: "Coming soon",
    },
    {
      text: "What would you tell other coaches about this platform?",
      author: "Your name",
      role: "Your role",
    },
    {
      text: "Love the platform? We'd love to hear from you.",
      author: "—",
      role: "Get in touch",
    },
    {
      text: "Real reviews from real coaches — coming soon.",
      author: "—",
      role: "Stay tuned",
    },
    {
      text: "Your experience here could help other coaches decide.",
      author: "Your name",
      role: "Coach",
    },
    { text: "Placeholder for future testimonials.", author: "—", role: "—" },
  ];

  const doubled = [...placeholders, ...placeholders];

  return (
    <section className="py-12 sm:py-16 bg-[#15191a] overflow-hidden border-y border-white/5">
      {/* Gradient Masks */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-[#15191a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-[#15191a] to-transparent z-10 pointer-events-none" />

        {/* Scrolling Container */}
        <div className="flex gap-4 sm:gap-6 animate-marquee">
          {doubled.map((item, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[300px] sm:w-[350px] bg-white/5 rounded-xl p-5 sm:p-6 border border-white/10 hover:border-[#E5B232]/30 transition-colors"
            >
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-4 italic">
                "{item.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B232]/20 flex items-center justify-center">
                  <span className="text-[#E5B232] text-xs font-bold">
                    {item.author === "—"
                      ? "…"
                      : item.author
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                          .slice(0, 2) || "?"}
                  </span>
                </div>
                <div>
                  <div className="text-zinc-500 text-sm font-medium">
                    {item.author}
                  </div>
                  <div className="text-zinc-600 text-xs">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

// ============================================
// VIDEO STEP PLAYER - Interactive Demo
// ============================================
function VideoStepPlayer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      number: "01",
      title: "Build Your Program",
      description:
        "Create training programs with our visual builder. Add drills, attach videos, and organize by week and day.",
      overlay: "Program Builder",
    },
    {
      number: "02",
      title: "Manage Your Athletes",
      description:
        "Track progress, view profiles, and see who needs attention. Assign programs instantly and monitor completion.",
      overlay: "Client Dashboard",
    },
    {
      number: "03",
      title: "Schedule & Communicate",
      description:
        "Let athletes book available slots. Send reminders, manage lessons, and keep everyone on the same page.",
      overlay: "Scheduling",
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const currentStepData = steps[currentStep];

  return (
    <div className="w-full" data-reveal>
      {/* Demo Container */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#15191a] border border-white/10 shadow-2xl">
        {/* Demo Area */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
          {/* Animated Demo Content */}
          <div className="absolute inset-0 p-3 sm:p-4 md:p-6">
            {currentStep === 0 && <ProgramBuilderDemo />}
            {currentStep === 1 && <ClientManagementDemo />}
            {currentStep === 2 && <SchedulingDemo />}

            {/* Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
              <span className="text-white text-xs sm:text-sm font-medium">
                {currentStepData.overlay}
              </span>
            </div>
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl">
              <div className="text-xs sm:text-sm font-medium text-[#E5B232] mb-1 sm:mb-2">
                Step {currentStepData.number}
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-all"
          >
            {isPlaying ? (
              <div className="flex gap-1">
                <div className="w-0.5 h-3 bg-white rounded-full"></div>
                <div className="w-0.5 h-3 bg-white rounded-full"></div>
              </div>
            ) : (
              <PlayCircle className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index);
                setIsPlaying(false);
              }}
              className={`relative transition-all ${
                index === currentStep ? "w-10" : "w-3 hover:w-5"
              } h-3 rounded-full ${
                index === currentStep
                  ? "bg-[#E5B232]"
                  : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
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

// ============================================
// DEMO COMPONENTS - Realistic UI previews
// ============================================
function ProgramBuilderDemo() {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const days = [
    { label: "Sun", drills: ["Warm-up", "Arm Circles", "Leg Drive"] },
    { label: "Mon", drills: ["Mechanics", "Release Point"] },
    { label: "Tue", drills: ["Rest Day"] },
    { label: "Wed", drills: ["Speed Work", "Spin Rate"] },
    { label: "Thu", drills: ["Changeup Dev", "Movement"] },
    { label: "Fri", drills: ["Bullpen", "Video Review"] },
    { label: "Sat", drills: ["Game Sim", "Mental Prep"] },
  ];

  return (
    <div className="h-full w-full bg-[#2A3133] rounded-xl border border-white/10 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 bg-[#1a1f20] border-r border-white/10"></div>

      {/* Main Content */}
      <div className="ml-12 sm:ml-16 h-full flex flex-col">
        <div className="h-8 sm:h-10 bg-white/5 rounded-lg mb-3 flex items-center px-3 border border-white/10">
          <div className="text-white font-medium text-xs sm:text-sm">
            Week 1 - Pitching Program
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, idx) => (
            <div
              key={day.label}
              className="bg-white/5 rounded-lg border border-white/10 p-1.5 sm:p-2 relative overflow-hidden"
              style={{
                animation:
                  animationStep >= idx ? "fadeInUp 0.5s ease-out" : "none",
              }}
            >
              <div className="text-[9px] sm:text-xs text-zinc-500 mb-1 font-medium">
                {day.label}
              </div>
              {animationStep > idx && day.drills[0] !== "Rest Day" ? (
                <div className="space-y-0.5 sm:space-y-1">
                  {day.drills.slice(0, 2).map((drill, drillIdx) => (
                    <div
                      key={drillIdx}
                      className="text-[8px] sm:text-[10px] text-white/80 bg-white/5 rounded px-1 sm:px-1.5 py-0.5 border border-white/10 truncate"
                    >
                      {drill}
                    </div>
                  ))}
                </div>
              ) : animationStep > idx ? (
                <div className="text-[8px] sm:text-[10px] text-zinc-500 italic">
                  Rest
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="h-7 sm:h-8 w-16 sm:w-20 bg-[#E5B232]/20 rounded-lg flex items-center justify-center text-[10px] sm:text-xs text-[#E5B232] border border-[#E5B232]/30 font-medium">
            Save
          </div>
          <div className="h-7 sm:h-8 w-16 sm:w-20 bg-white/5 rounded-lg flex items-center justify-center text-[10px] sm:text-xs text-white border border-white/10">
            Add Week
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientManagementDemo() {
  const clients = [
    { name: "Sarah Mitchell", initials: "SM", progress: 78, status: "Active" },
    { name: "Michael Chen", initials: "MC", progress: 65, status: "Active" },
    {
      name: "Jessica Rodriguez",
      initials: "JR",
      progress: 92,
      status: "Active",
    },
    { name: "Alex Thompson", initials: "AT", progress: 45, status: "Active" },
  ];

  return (
    <div className="h-full w-full bg-[#2A3133] rounded-xl border border-white/10 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <div className="h-8 sm:h-10 bg-white/5 rounded-lg mb-3 flex items-center justify-between px-3 border border-white/10">
        <div className="text-white font-medium text-xs sm:text-sm">
          Your Athletes
        </div>
        <div className="h-6 w-16 sm:w-20 bg-[#E5B232]/20 rounded flex items-center justify-center text-[10px] sm:text-xs text-[#E5B232] border border-[#E5B232]/30">
          + Add
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {clients.map((client, idx) => (
          <div
            key={client.name}
            className="bg-white/5 rounded-lg border border-white/10 p-2 sm:p-3"
            style={{ animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s both` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#4A5A70] flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shrink-0">
                {client.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-xs sm:text-sm truncate">
                  {client.name}
                </div>
                <div className="text-[10px] text-green-400">
                  {client.status}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500">Progress</span>
                <span className="text-[#E5B232] font-medium">
                  {client.progress}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E5B232] rounded-full transition-all duration-500"
                  style={{ width: `${client.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      client: "Sarah M.",
      type: "Lesson",
      status: "Confirmed",
    },
    {
      time: "11:00 AM",
      client: "Michael C.",
      type: "Review",
      status: "Confirmed",
    },
    {
      time: "2:00 PM",
      client: "Jessica R.",
      type: "Lesson",
      status: "Pending",
    },
    { time: "4:00 PM", client: "Alex T.", type: "Lesson", status: "Confirmed" },
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="h-full w-full bg-[#2A3133] rounded-xl border border-white/10 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <div className="h-8 sm:h-10 bg-white/5 rounded-lg mb-3 flex items-center justify-between px-3 border border-white/10">
        <div className="text-white font-medium text-xs sm:text-sm">
          January 2025
        </div>
        <div className="flex gap-1">
          <div className="h-6 w-6 bg-white/10 rounded flex items-center justify-center text-white text-xs">
            ←
          </div>
          <div className="h-6 w-6 bg-white/10 rounded flex items-center justify-center text-white text-xs">
            →
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((day, idx) => (
          <div
            key={day}
            className={`text-center text-[9px] sm:text-[10px] py-1 rounded ${
              idx === 3
                ? "bg-[#E5B232]/20 text-[#E5B232] font-medium"
                : "text-zinc-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-1.5 max-h-40 sm:max-h-48 overflow-y-auto">
        {scheduleItems.map((item, idx) => (
          <div
            key={item.time}
            className="bg-white/5 rounded-lg border border-white/10 p-2 flex items-center justify-between"
            style={{
              animation:
                animationStep >= idx
                  ? `slideInRight 0.5s ease-out ${idx * 0.15}s both`
                  : "none",
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-12 sm:w-14 text-[10px] sm:text-xs text-zinc-400 font-medium shrink-0">
                {item.time}
              </div>
              {animationStep > idx && (
                <>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#4A5A70] flex items-center justify-center text-white text-[8px] sm:text-[10px] font-bold shrink-0">
                    {item.client
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[10px] sm:text-xs font-medium truncate">
                      {item.client}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-zinc-500">
                      {item.type}
                    </div>
                  </div>
                </>
              )}
            </div>
            {animationStep > idx && (
              <div
                className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-medium shrink-0 ${
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

// ============================================
// WHO CARD COMPONENT
// ============================================
function WhoCard({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  const isCoach = title === "For Coaches";
  const isAthlete = title === "For Athletes";
  const isTeam = title === "For Teams";

  return (
    <div
      className="group bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl shadow-lg overflow-hidden border border-white/10 hover:border-[#E5B232]/40 transition-all duration-500 hover:shadow-xl hover:shadow-[#E5B232]/5"
      data-reveal
    >
      <div className="relative aspect-[16/10] bg-[#1a1f20] border-b border-white/10 overflow-hidden">
        {isCoach && <CoachDashboardDemo />}
        {isAthlete && <AthleteDashboardDemo />}
        {isTeam && <TeamWorkspaceDemo />}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#E5B232]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-[#E5B232] transition-colors duration-300">
          {title}
        </h3>
        <p className="text-zinc-400 mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#E5B232]/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#E5B232]/30 transition-colors">
                <Check className="h-3 w-3 text-[#E5B232]" />
              </div>
              <span className="text-zinc-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// FEATURE CARD - Interactive Bento Cards
// ============================================
function FeatureCard({
  title,
  description,
  visual,
  delay = 0,
}: {
  title: string;
  description: string;
  visual: React.ReactNode;
  delay?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f20] to-[#15191a] rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#E5B232]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-[#E5B232]/40 transition-colors duration-300" />

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_30px_rgba(229,178,50,0.05)]" />

      <div className="relative p-5 sm:p-6 h-full flex flex-col">
        {/* Visual Preview */}
        <div className="relative h-32 sm:h-36 mb-4 rounded-xl overflow-hidden bg-[#0f1112] border border-white/5">
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
            {visual}
          </div>
          {/* Scan line effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E5B232]/10 to-transparent pointer-events-none"
            initial={{ y: "-100%" }}
            animate={isHovered ? { y: "200%" } : { y: "-100%" }}
            transition={{
              duration: 1.5,
              ease: "linear",
              repeat: isHovered ? Infinity : 0,
            }}
          />
        </div>

        {/* Content */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-[#E5B232] transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed flex-1">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// MINI FEATURE VISUALIZATIONS
// ============================================
function ProgramBuilderMini() {
  return (
    <div className="h-full w-full p-2 flex gap-1">
      {/* Mini calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-0.5">
        {Array.from({ length: 7 }).map((_, dayIdx) => (
          <div key={dayIdx} className="flex flex-col gap-0.5">
            <div className="text-[6px] text-zinc-600 text-center">
              {["S", "M", "T", "W", "T", "F", "S"][dayIdx]}
            </div>
            {Array.from({ length: 3 }).map((_, drillIdx) => (
              <motion.div
                key={drillIdx}
                className="h-6 rounded-sm"
                style={{
                  backgroundColor:
                    dayIdx === 2
                      ? "rgba(255,255,255,0.03)"
                      : drillIdx === 0
                        ? "rgba(229,178,50,0.3)"
                        : drillIdx === 1
                          ? "rgba(229,178,50,0.2)"
                          : "rgba(255,255,255,0.05)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: dayIdx * 0.05 + drillIdx * 0.05 }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Side panel */}
      <div className="w-16 bg-white/5 rounded-lg p-1.5">
        <div className="w-full h-2 bg-[#E5B232]/30 rounded mb-1.5" />
        <div className="w-3/4 h-1.5 bg-white/10 rounded mb-1" />
        <div className="w-1/2 h-1.5 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function VideoAnalysisMini() {
  return (
    <div className="h-full w-full p-2 flex gap-2">
      {/* Video preview */}
      <div className="flex-1 bg-white/5 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#E5B232]/20 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-[#E5B232] border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
          </div>
        </div>
        {/* Timeline */}
        <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#E5B232]/60 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "65%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
        {/* Annotation dots */}
        <motion.div
          className="absolute top-3 right-4 w-3 h-3 rounded-full bg-[#E5B232]/80"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      {/* Tools panel */}
      <div className="w-10 flex flex-col gap-1">
        {[0.4, 0.2, 0.2, 0.15].map((opacity, idx) => (
          <div
            key={idx}
            className="flex-1 rounded"
            style={{
              backgroundColor:
                idx === 0
                  ? `rgba(229,178,50,${opacity})`
                  : `rgba(255,255,255,${opacity})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ClientManagementMini() {
  return (
    <div className="h-full w-full p-2">
      <div className="flex flex-col gap-1">
        {[
          { initials: "AT", progress: 85, color: "#E5B232" },
          { initials: "SM", progress: 72, color: "#4A9D5C" },
          { initials: "JW", progress: 90, color: "#5B8DEE" },
          { initials: "RK", progress: 45, color: "#E5B232" },
        ].map((client, idx) => (
          <motion.div
            key={idx}
            className="flex items-center gap-2 bg-white/5 rounded-lg p-1.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[6px] font-bold text-white"
              style={{ backgroundColor: `${client.color}30` }}
            >
              {client.initials}
            </div>
            <div className="flex-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: client.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${client.progress}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                />
              </div>
            </div>
            <div className="text-[8px] text-zinc-500 w-6 text-right">
              {client.progress}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SchedulingMini() {
  return (
    <div className="h-full w-full p-2">
      <div className="grid grid-cols-5 gap-0.5 h-full">
        {Array.from({ length: 5 }).map((_, dayIdx) => (
          <div key={dayIdx} className="flex flex-col gap-0.5">
            <div className="text-[6px] text-zinc-600 text-center mb-0.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri"][dayIdx]}
            </div>
            {Array.from({ length: 4 }).map((_, slotIdx) => {
              const isBooked =
                (dayIdx === 0 && slotIdx === 1) ||
                (dayIdx === 1 && slotIdx === 2) ||
                (dayIdx === 2 && slotIdx === 0) ||
                (dayIdx === 3 && slotIdx === 3) ||
                (dayIdx === 4 && slotIdx === 1);
              return (
                <motion.div
                  key={slotIdx}
                  className={`flex-1 rounded-sm ${
                    isBooked
                      ? "bg-[#E5B232]/30 border border-[#E5B232]/40"
                      : "bg-white/5 border border-white/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: dayIdx * 0.05 + slotIdx * 0.03 }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagingMini() {
  return (
    <div className="h-full w-full p-2 flex gap-2">
      {/* Conversation list */}
      <div className="w-14 flex flex-col gap-1">
        {[true, false, false].map((active, idx) => (
          <div
            key={idx}
            className={`p-1 rounded ${active ? "bg-[#E5B232]/20" : "bg-white/5"}`}
          >
            <div className="flex items-center gap-1">
              <div
                className={`w-4 h-4 rounded-full ${active ? "bg-[#E5B232]/40" : "bg-white/10"}`}
              />
              <div className="flex-1">
                <div className="h-1 w-6 bg-white/20 rounded" />
                <div className="h-0.5 w-4 bg-white/10 rounded mt-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col justify-end gap-1">
        <motion.div
          className="self-start bg-white/10 rounded-lg px-2 py-1 max-w-[70%]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="h-1 w-12 bg-white/20 rounded" />
        </motion.div>
        <motion.div
          className="self-end bg-[#E5B232]/20 rounded-lg px-2 py-1 max-w-[70%]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="h-1 w-16 bg-[#E5B232]/40 rounded" />
        </motion.div>
        <motion.div
          className="self-start bg-white/10 rounded-lg px-2 py-1 max-w-[70%]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="h-1 w-8 bg-white/20 rounded" />
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsMini() {
  const bars = [40, 65, 45, 80, 55, 90, 70];

  return (
    <div className="h-full w-full p-2 flex flex-col">
      {/* Stats row */}
      <div className="flex gap-1 mb-2">
        {[
          { value: "94%", label: "Completion" },
          { value: "12", label: "Active" },
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 bg-white/5 rounded p-1 text-center">
            <div className="text-[10px] font-bold text-[#E5B232]">
              {stat.value}
            </div>
            <div className="text-[6px] text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="flex-1 flex items-end gap-0.5">
        {bars.map((height, idx) => (
          <motion.div
            key={idx}
            className="flex-1 rounded-t"
            style={{
              backgroundColor: idx === 5 ? "#E5B232" : "rgba(229,178,50,0.3)",
            }}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// DEVICE MOCKUP - Dashboard Preview
// ============================================
function DeviceMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="bg-[#1a1a1a] rounded-t-lg p-1.5 shadow-2xl">
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
                  app.nextlevelcoaching.com
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-3 bg-[#2A3133] min-h-[400px]">
              <div className="flex gap-3 h-full">
                {/* Sidebar */}
                <motion.div
                  className="w-14 bg-[#1a1f20] rounded-lg p-2 flex flex-col items-center gap-2 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-8 h-8 bg-[#E5B232]/20 rounded mb-2"></div>
                  <div className="space-y-1.5 flex-1 w-full">
                    <div className="w-full h-8 bg-[#E5B232]/20 rounded border border-[#E5B232]/30"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                    <div className="w-full h-8 bg-white/5 rounded"></div>
                  </div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 space-y-3">
                  <motion.div
                    className="mb-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-lg font-bold text-white mb-1">
                      Welcome back, Coach
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Monday, January 15, 2025
                    </p>
                  </motion.div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Active Athletes", value: "12" },
                      { label: "Programs", value: "8" },
                      { label: "Today's Lessons", value: "5" },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        className="bg-white/5 rounded-lg p-2.5 border border-white/10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                      >
                        <div className="text-xs text-zinc-500 mb-1">
                          {stat.label}
                        </div>
                        <div className="text-xl font-bold text-white">
                          {stat.value}
                        </div>
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
                    <div className="text-sm font-semibold text-white mb-2">
                      Week at a Glance
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => {
                        const isToday = idx === 1;
                        return (
                          <div
                            key={idx}
                            className={`text-center p-1 rounded border ${
                              isToday
                                ? "bg-[#E5B232]/20 border-[#E5B232]/30"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <div className="text-[9px] text-zinc-500">
                              {day}
                            </div>
                            <div className="text-[10px] font-medium text-zinc-300">
                              {13 + idx}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <h3 className="text-sm font-semibold text-white mb-2">
                        Notifications
                      </h3>
                      <div className="text-[10px] text-zinc-400">
                        New video from Alex
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Program completed by Sarah
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <h3 className="text-sm font-semibold text-white mb-2">
                        Today
                      </h3>
                      <div className="text-[10px] text-zinc-400">
                        2:00 PM - Alex Thompson
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        4:00 PM - Sarah Mitchell
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1a] h-2 rounded-b-lg shadow-2xl"></div>
        <div className="bg-[#0f0f0f] h-1 rounded-b-lg mx-8"></div>
      </div>
    </div>
  );
}

// ============================================
// MINI DEMO COMPONENTS
// ============================================
function CoachDashboardDemo() {
  return (
    <div className="h-full w-full flex bg-[#2A3133] p-2 text-xs">
      <div className="w-12 bg-[#1a1f20] rounded-lg mr-2 flex flex-col items-center py-2 border border-white/10">
        <div className="w-5 h-5 bg-[#E5B232]/20 rounded mb-2"></div>
        <div className="space-y-1 flex-1">
          <div className="w-5 h-5 bg-[#E5B232]/20 rounded border border-[#E5B232]/30"></div>
          <div className="w-5 h-5 bg-white/5 rounded"></div>
          <div className="w-5 h-5 bg-white/5 rounded"></div>
        </div>
      </div>
      <div className="flex-1 bg-[#1a1f20] rounded-lg p-2 border border-white/10">
        <div className="text-[10px] font-bold text-white mb-1">Dashboard</div>
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="bg-white/5 rounded p-1 border border-white/10">
            <div className="text-[9px] text-[#E5B232] font-bold">12</div>
            <div className="text-[7px] text-zinc-500">Athletes</div>
          </div>
          <div className="bg-white/5 rounded p-1 border border-white/10">
            <div className="text-[9px] text-white font-bold">8</div>
            <div className="text-[7px] text-zinc-500">Programs</div>
          </div>
          <div className="bg-white/5 rounded p-1 border border-white/10">
            <div className="text-[9px] text-white font-bold">5</div>
            <div className="text-[7px] text-zinc-500">Today</div>
          </div>
        </div>
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="text-[8px] text-white font-medium mb-1">Recent</div>
          <div className="text-[7px] text-zinc-400">Video from Alex T.</div>
          <div className="text-[7px] text-zinc-400">Sarah completed Week 2</div>
        </div>
      </div>
    </div>
  );
}

function AthleteDashboardDemo() {
  return (
    <div className="h-full w-full flex flex-col bg-[#2A3133] p-2 text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="w-16 h-3 bg-white/10 rounded"></div>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-white/10 rounded"></div>
          <div className="w-5 h-5 bg-white/10 rounded-full"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="text-[8px] text-zinc-500">Next Lesson</div>
          <div className="text-[10px] text-white font-medium">Tomorrow</div>
        </div>
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="text-[8px] text-zinc-500">Progress</div>
          <div className="text-[10px] text-[#E5B232] font-medium">78%</div>
        </div>
        <div className="bg-white/5 rounded p-1.5 border border-white/10">
          <div className="text-[8px] text-zinc-500">Messages</div>
          <div className="text-[10px] text-white font-medium">2 new</div>
        </div>
      </div>
      <div className="flex-1 bg-[#1a1f20] rounded-lg p-2 border border-white/10">
        <div className="text-[9px] font-semibold text-white mb-1">
          Today's Workout
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-2 h-2 text-green-400" />
            </div>
            <span className="text-[8px] text-zinc-300">Warm-up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#E5B232]/20"></div>
            <span className="text-[8px] text-zinc-300">Mechanics Drill</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-white/10"></div>
            <span className="text-[8px] text-zinc-300">Video Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamWorkspaceDemo() {
  return (
    <div className="h-full w-full flex bg-[#2A3133] p-2 text-xs">
      <div className="w-12 bg-[#1a1f20] rounded-lg mr-2 flex flex-col items-center py-2 border border-white/10">
        <div className="w-5 h-5 bg-white/10 rounded mb-2"></div>
        <div className="space-y-1 flex-1">
          <div className="w-5 h-5 bg-white/10 rounded border border-white/20"></div>
          <div className="w-5 h-5 bg-white/5 rounded"></div>
          <div className="w-5 h-5 bg-white/5 rounded"></div>
        </div>
      </div>
      <div className="flex-1 bg-[#1a1f20] rounded-lg p-2 border border-white/10">
        <div className="flex items-center gap-1 mb-2">
          <div className="w-3 h-3 bg-white/10 rounded"></div>
          <div className="text-[10px] font-bold text-white">Elite Academy</div>
        </div>
        <div className="grid grid-cols-2 gap-1 mb-2">
          <div className="bg-white/5 rounded p-1 border border-white/10">
            <div className="text-[10px] text-white font-bold">3</div>
            <div className="text-[7px] text-zinc-500">Coaches</div>
          </div>
          <div className="bg-white/5 rounded p-1 border border-white/10">
            <div className="text-[10px] text-white font-bold">42</div>
            <div className="text-[7px] text-zinc-500">Athletes</div>
          </div>
        </div>
        <div className="text-[8px] text-white font-medium mb-1">Team</div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 bg-white/5 rounded p-1 border border-white/10">
            <div className="w-4 h-4 rounded-full bg-[#4A5A70] flex items-center justify-center text-white text-[7px] font-bold">
              JD
            </div>
            <div className="text-[8px] text-white">John Davis</div>
            <div className="text-[6px] text-zinc-500 ml-auto">Owner</div>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded p-1 border border-white/10">
            <div className="w-4 h-4 rounded-full bg-[#4A5A70] flex items-center justify-center text-white text-[7px] font-bold">
              MS
            </div>
            <div className="text-[8px] text-white">Maria Smith</div>
            <div className="text-[6px] text-zinc-500 ml-auto">Coach</div>
          </div>
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
