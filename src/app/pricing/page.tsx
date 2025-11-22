"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Star,
  Zap,
  Library,
  Sparkles,
  Users,
  Video,
  MessageSquare,
  Calendar,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  TrendingUp,
  Shield,
  Smartphone,
  Globe,
  FileText,
  PlayCircle,
  Crown,
  Award,
  Rocket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STANDARD_TIER,
  MASTER_LIBRARY_TIER,
  PREMADE_ROUTINES_TIER,
} from "@/lib/pricing";

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<
    "STANDARD" | "MASTER_LIBRARY" | "PREMADE_ROUTINES"
  >("STANDARD");

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

  const tiers = {
    STANDARD: STANDARD_TIER,
    MASTER_LIBRARY: MASTER_LIBRARY_TIER,
    PREMADE_ROUTINES: PREMADE_ROUTINES_TIER,
  };

  const currentTier = tiers[selectedTier];
  const clientLimits = [10, 25, 50] as const;

  return (
    <main className="relative -mt-14 min-h-screen overflow-hidden bg-gradient-to-br from-[#2A3133] via-[#1a1f20] to-black">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />

      {/* HERO */}
      <section className="relative z-10 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12">
        <MaxWidthWrapper className="text-center px-4 sm:px-6">
          <div data-reveal>
            <h1 className="mx-auto max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Simple, Transparent
              <br className="hidden sm:block" />
              <span className="block sm:inline"> </span>
              <span className="text-white">Pricing</span>
            </h1>

            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-zinc-300 px-4 sm:px-0">
              Pay only for what you need. Scale up as your business grows.
              <span className="block sm:inline mt-1 sm:mt-0">
                <span className="text-white font-semibold">
                  No hidden fees, no surprises.
                </span>
              </span>
            </p>

            {/* Trust Indicators */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-400 px-4 sm:px-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-400" />
                <span>Athletes train free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-400" />
                <span>Coaches pay monthly</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* PRICING TIERS */}
      <section className="relative z-10 py-12 sm:py-16 md:py-24">
        <MaxWidthWrapper className="px-4 sm:px-6">
          {/* Tier Selection */}
          <div className="mb-8 sm:mb-12" data-reveal>
            <div className="flex justify-center">
              <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 w-full max-w-fit mx-auto sm:w-auto">
                {[
                  {
                    id: "STANDARD",
                    label: "Standard",
                    icon: <Zap className="h-4 w-4" />,
                    description: "Core features",
                  },
                  {
                    id: "MASTER_LIBRARY",
                    label: "Master Library",
                    icon: <Library className="h-4 w-4" />,
                    description: "Expert content",
                  },
                  {
                    id: "PREMADE_ROUTINES",
                    label: "Premade Routines",
                    icon: <Sparkles className="h-4 w-4" />,
                    description: "Coming soon",
                  },
                ].map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id as any)}
                    className={`flex flex-col items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                      selectedTier === tier.id
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tier.icon}
                    <span className="hidden sm:inline">{tier.label}</span>
                    <span className="sm:hidden">
                      {tier.label.split(" ")[0]}
                    </span>
                    <span className="text-xs text-zinc-500 hidden sm:block">
                      {tier.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Cards - All Client Limits */}
          <div className="mb-8 sm:mb-12" data-reveal>
            <h3 className="text-lg sm:text-xl font-semibold text-white text-center mb-6 sm:mb-8">
              Choose your plan size
            </h3>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3 pt-4">
              {clientLimits.map(limit => (
                <PricingCard
                  key={limit}
                  tier={currentTier}
                  clientLimit={limit}
                  price={currentTier.pricing[limit]}
                  isPopular={limit === 25}
                />
              ))}
            </div>

            {/* Enterprise CTA */}
            <div className="mt-8 sm:mt-12 text-center">
              <p className="text-sm sm:text-base text-zinc-400 mb-4">
                Need more than 50 clients?
              </p>
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30">
                View Enterprise Plans
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="mt-16 sm:mt-20" data-reveal>
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
              What's included in each tier?
            </h3>
            <FeatureComparison tiers={tiers} selectedTier={selectedTier} />
          </div>

          {/* FAQ Section */}
          <div className="mt-16 sm:mt-20" data-reveal>
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
              Frequently Asked Questions
            </h3>
            <FAQSection />
          </div>

          {/* Final CTA */}
          <div className="mt-16 sm:mt-20 text-center" data-reveal>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Ready to scale your coaching business?
            </h3>
            <p className="text-lg text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of coaches who are already using NextLevel to grow
              their business.
            </p>
            <RegisterLink className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:scale-[1.02]">
              Get Started
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </RegisterLink>
          </div>
        </MaxWidthWrapper>
      </section>
    </main>
  );
}

// Pricing Card Component
function PricingCard({
  tier,
  clientLimit,
  price,
  isPopular = false,
}: {
  tier: any;
  clientLimit: number;
  price: number;
  isPopular?: boolean;
}) {
  return (
    <div className="relative overflow-visible rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 transition-all hover:bg-white/10 hover:border-white/30">
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center">
        {/* Client Limit */}
        <div className="mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {clientLimit} Clients
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Perfect for{" "}
            {clientLimit === 10
              ? "starting coaches"
              : clientLimit === 25
              ? "growing coaches"
              : "established coaches"}
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-white">
              ${price}
            </span>
            <span className="text-sm sm:text-base text-zinc-400">/month</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            ${(price / clientLimit).toFixed(2)} per client
          </p>
        </div>

        {/* Key Features */}
        <div className="space-y-2 mb-6">
          {tier.features.slice(0, 4).map((feature: string, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300"
            >
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-400 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
          {tier.features.length > 4 && (
            <div className="text-xs text-zinc-500">
              +{tier.features.length - 4} more features
            </div>
          )}
        </div>

        {/* CTA Button */}
        <RegisterLink className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:scale-[1.02] w-full justify-center">
          Get Started
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
        </RegisterLink>
      </div>
    </div>
  );
}

// Feature Comparison Component
function FeatureComparison({
  tiers,
  selectedTier,
}: {
  tiers: any;
  selectedTier: string;
}) {
  const features = [
    {
      category: "Core Platform",
      items: [
        {
          name: "Client Management",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Program Creation",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Video Analysis",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Messaging System",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Scheduling",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Analytics Dashboard",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
      ],
    },
    {
      category: "Content & Resources",
      items: [
        {
          name: "Personal Video Library",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Expert Master Library",
          standard: false,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Premade Routines",
          standard: false,
          masterLibrary: false,
          premadeRoutines: true,
        },
        {
          name: "Template Programs",
          standard: false,
          masterLibrary: false,
          premadeRoutines: true,
        },
      ],
    },
    {
      category: "Advanced Features",
      items: [
        {
          name: "Unlimited Programs",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Progress Tracking",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "File Sharing",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
        {
          name: "Mobile App Access",
          standard: true,
          masterLibrary: true,
          premadeRoutines: true,
        },
      ],
    },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-sm font-semibold text-zinc-400">Features</div>
          <div className="text-center">
            <div className="text-sm font-semibold text-white">Standard</div>
            <div className="text-xs text-zinc-500">Core platform</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-white">
              Master Library
            </div>
            <div className="text-xs text-zinc-500">+ Expert content</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-white">
              Premade Routines
            </div>
            <div className="text-xs text-zinc-500">+ Ready programs</div>
          </div>
        </div>

        {/* Feature Rows */}
        {features.map((category, categoryIdx) => (
          <div key={categoryIdx} className="mb-8">
            <h4 className="text-sm font-semibold text-white mb-4">
              {category.category}
            </h4>
            <div className="space-y-3">
              {category.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="grid grid-cols-4 gap-4 items-center py-2 border-b border-white/5"
                >
                  <div className="text-sm text-zinc-300">{item.name}</div>
                  <div className="text-center">
                    {item.standard ? (
                      <Check className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <div className="h-4 w-4 mx-auto" />
                    )}
                  </div>
                  <div className="text-center">
                    {item.masterLibrary ? (
                      <Check className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <div className="h-4 w-4 mx-auto" />
                    )}
                  </div>
                  <div className="text-center">
                    {item.premadeRoutines ? (
                      <Check className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <div className="h-4 w-4 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Section Component
function FAQSection() {
  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer:
        "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.",
    },
    {
      question: "What happens if I exceed my client limit?",
      answer:
        "We'll notify you when you're approaching your limit. You can upgrade your plan or we can temporarily increase your limit while you decide.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Athletes can use the platform for free. Coaches pay monthly with no credit card required to sign up. You can cancel anytime.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Absolutely. You can cancel your subscription at any time from your account settings. No cancellation fees or penalties.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through Stripe.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer:
        "Yes! Save 20% when you pay annually. Contact our support team to set up annual billing.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <span className="text-sm sm:text-base font-semibold text-white">
              {faq.question}
            </span>
            <div
              className={`transform transition-transform ${
                openIndex === idx ? "rotate-180" : ""
              }`}
            >
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </div>
          </button>
          <AnimatePresence>
            {openIndex === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-sm sm:text-base text-zinc-400">
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
