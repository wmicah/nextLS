"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Users,
  Calendar,
  Video,
  BarChart3,
  MessageSquare,
  Smartphone,
  BookOpen,
  Clipboard,
  Target,
  Brain,
  Trophy,
  TrendingUp,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

export default function PricingPage() {
  useEffect(() => {
    // Scroll reveal animation
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

  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for new coaches getting started",
      features: [
        "Up to 10 clients",
        "Basic program builder",
        "Video library (50 videos)",
        "Client messaging",
        "Mobile app access",
        "Email support",
      ],
      limitations: ["Basic analytics", "Standard templates"],
      popular: false,
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Professional",
      price: "$59",
      period: "/month",
      description: "Most popular for established coaches",
      features: [
        "Up to 50 clients",
        "Advanced program builder",
        "Unlimited video library",
        "Video analysis tools",
        "Advanced analytics",
        "Smart scheduling",
        "Client self-booking",
        "Priority support",
        "Custom branding",
      ],
      limitations: [],
      popular: true,
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large coaching operations",
      features: [
        "Unlimited clients",
        "All Professional features",
        "Team management",
        "Advanced reporting",
        "API access",
        "White-label options",
        "Dedicated support",
        "Custom integrations",
        "Advanced security",
      ],
      limitations: [],
      popular: false,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const athletePlans = [
    {
      name: "Individual",
      price: "$19",
      period: "/month",
      description: "For individual athletes",
      features: [
        "Access to assigned programs",
        "Video library access",
        "Progress tracking",
        "Coach communication",
        "Mobile app",
        "Goal setting",
      ],
    },
    {
      name: "Team",
      price: "$15",
      period: "/athlete/month",
      description: "For team athletes",
      features: [
        "All Individual features",
        "Team program access",
        "Team communication",
        "Team analytics",
        "Bulk management",
        "Team scheduling",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
      <Navbar />
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(1200px_600px_at_8%_-10%,rgba(56,189,248,.15),transparent_60%),radial-gradient(900px_500px_at_90%_0%,rgba(59,130,246,.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      {/* Hero Section */}
      <section className="relative z-10 pt-24 sm:pt-32 pb-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-4xl text-center" data-reveal>
            <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight md:text-6xl lg:text-7xl">
              Simple, transparent{" "}
              <span className="bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                pricing
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-zinc-300">
              Choose the plan that fits your coaching needs. Start with a 14-day
              free trial, no credit card required.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                14-day free trial for all plans
              </span>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Coach Plans */}
      <section className="relative z-10 py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center mb-16" data-reveal>
            <h2 className="text-4xl font-bold text-white mb-4">For Coaches</h2>
            <p className="text-xl text-zinc-400">
              Everything you need to run a successful coaching business
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} index={index} />
            ))}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Athlete Plans */}
      <section className="relative z-10 py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center mb-16" data-reveal>
            <h2 className="text-4xl font-bold text-white mb-4">For Athletes</h2>
            <p className="text-xl text-zinc-400">
              Access your training programs and track your progress
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {athletePlans.map((plan, index) => (
              <AthletePricingCard key={plan.name} plan={plan} index={index} />
            ))}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Features Comparison */}
      <section className="relative z-10 py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center mb-16" data-reveal>
            <h2 className="text-4xl font-bold text-white mb-4">
              What's Included
            </h2>
            <p className="text-xl text-zinc-400">
              All plans include these core features
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureItem
              icon={<Users className="h-6 w-6" />}
              title="Client Management"
              description="Track and communicate with all your athletes"
            />
            <FeatureItem
              icon={<Clipboard className="h-6 w-6" />}
              title="Program Builder"
              description="Create structured training programs with videos"
            />
            <FeatureItem
              icon={<Video className="h-6 w-6" />}
              title="Video Analysis"
              description="Professional tools for technique feedback"
            />
            <FeatureItem
              icon={<Calendar className="h-6 w-6" />}
              title="Smart Scheduling"
              description="Automated scheduling with reminders"
            />
            <FeatureItem
              icon={<BarChart3 className="h-6 w-6" />}
              title="Analytics"
              description="Track progress and business metrics"
            />
            <FeatureItem
              icon={<Smartphone className="h-6 w-6" />}
              title="Mobile App"
              description="Full platform access on any device"
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center mb-16" data-reveal>
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-zinc-400">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <FAQItem
              question="Is there a free trial?"
              answer="Yes! All plans include a 14-day free trial with no credit card required. You can cancel anytime during the trial period."
            />
            <FAQItem
              question="Can I change plans later?"
              answer="Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
            />
            <FAQItem
              question="What happens to my data if I cancel?"
              answer="Your data is always yours. You can export all your programs, client information, and videos before canceling. We'll keep your data for 30 days after cancellation."
            />
            <FAQItem
              question="Do you offer team discounts?"
              answer="Yes! We offer special pricing for teams and organizations. Contact us for custom pricing based on your needs."
            />
            <FAQItem
              question="Is there a setup fee?"
              answer="No setup fees, no hidden costs. What you see is what you pay. We believe in transparent, straightforward pricing."
            />
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16">
        <MaxWidthWrapper>
          <div
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-sky-600/20 via-sky-500/10 to-transparent p-12"
            data-reveal
          >
            <div className="absolute -inset-24 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.25),transparent_40%)]" />
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-zinc-300 mb-8">
                Join hundreds of coaches already using Next Level Softball to
                grow their business and develop better athletes.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <RegisterLink className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-neutral-900 transition hover:bg-zinc-100 hover:scale-105">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </RegisterLink>
                <Link
                  href="/features"
                  className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"
                >
                  View All Features
                </Link>
              </div>
              <p className="mt-6 text-sm text-zinc-400">
                14-day free trial • No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  );
}

function PricingCard({ plan, index }: { plan: any; index: number }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        plan.popular
          ? "border-sky-500/50 bg-gradient-to-b from-sky-500/5 to-transparent"
          : "border-white/10 bg-white/[.04]"
      } p-8 transition-all hover:border-white/20`}
      data-reveal
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white">
            <Star className="h-4 w-4 fill-current" />
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
        <p className="text-zinc-400 mb-6">{plan.description}</p>

        <div className="mb-6">
          <span className="text-5xl font-bold text-white">{plan.price}</span>
          <span className="text-xl text-zinc-400">{plan.period}</span>
        </div>

        <RegisterLink
          className={`w-full inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold transition-all ${
            plan.popular
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 hover:scale-105"
              : "border border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
          }`}
        >
          Start Free Trial
          <ArrowRight className="ml-2 h-4 w-4" />
        </RegisterLink>
      </div>

      <div className="mt-8 space-y-4">
        {plan.features.map((feature: string, featureIndex: number) => (
          <div key={featureIndex} className="flex items-center gap-3">
            <Check className="h-5 w-5 text-sky-400 flex-shrink-0" />
            <span className="text-white">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AthletePricingCard({ plan, index }: { plan: any; index: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] p-8 transition-all hover:border-white/20"
      data-reveal
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
        <p className="text-zinc-400 mb-6">{plan.description}</p>

        <div className="mb-6">
          <span className="text-5xl font-bold text-white">{plan.price}</span>
          <span className="text-xl text-zinc-400">{plan.period}</span>
        </div>

        <RegisterLink className="w-full inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white/90 transition-all hover:bg-white/10">
          Start Free Trial
          <ArrowRight className="ml-2 h-4 w-4" />
        </RegisterLink>
      </div>

      <div className="mt-8 space-y-4">
        {plan.features.map((feature: string, featureIndex: number) => (
          <div key={featureIndex} className="flex items-center gap-3">
            <Check className="h-5 w-5 text-sky-400 flex-shrink-0" />
            <span className="text-white">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-sky-300 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border border-white/10 rounded-xl p-6 bg-white/[.02]">
      <h3 className="text-lg font-semibold text-white mb-3">{question}</h3>
      <p className="text-zinc-400">{answer}</p>
    </div>
  );
}
