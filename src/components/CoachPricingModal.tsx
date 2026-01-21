"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Zap,
  Library,
  Sparkles,
  ArrowRight,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react";
import {
  STANDARD_TIER,
  MASTER_LIBRARY_TIER,
  PREMADE_ROUTINES_TIER,
} from "@/lib/pricing";

interface CoachPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (tier: string, clientLimit: number) => void;
}

export default function CoachPricingModal({
  isOpen,
  onClose,
  onSelectPlan,
}: CoachPricingModalProps) {
  const [selectedTier, setSelectedTier] = useState<
    "STANDARD" | "MASTER_LIBRARY" | "PREMADE_ROUTINES"
  >("STANDARD");
  const [selectedClientLimit, setSelectedClientLimit] = useState<10 | 25 | 50>(
    25
  );

  const tiers = {
    STANDARD: STANDARD_TIER,
    MASTER_LIBRARY: MASTER_LIBRARY_TIER,
    PREMADE_ROUTINES: PREMADE_ROUTINES_TIER,
  };

  const currentTier = tiers[selectedTier];
  const currentPrice = currentTier.pricing[selectedClientLimit];
  const clientLimits = [10, 25, 50] as const;

  const handleSelectPlan = () => {
    onSelectPlan(selectedTier, selectedClientLimit);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border"
          style={{
            backgroundColor: "#2A3133",
            borderColor: "#606364",
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
            style={{ borderColor: "#606364", backgroundColor: "#2A3133" }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white">
                Choose Your Coaching Plan
              </h2>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Select the plan that fits your coaching business
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tier Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Choose Your Tier
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    id: "STANDARD",
                    tier: STANDARD_TIER,
                    icon: <Zap className="h-6 w-6" />,
                    popular: false,
                  },
                  {
                    id: "MASTER_LIBRARY",
                    tier: MASTER_LIBRARY_TIER,
                    icon: <Library className="h-6 w-6" />,
                    popular: true,
                  },
                  {
                    id: "PREMADE_ROUTINES",
                    tier: PREMADE_ROUTINES_TIER,
                    icon: <Sparkles className="h-6 w-6" />,
                    popular: false,
                  },
                ].map(({ id, tier, icon, popular }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedTier(id as any)}
                    className={`relative p-4 rounded-xl border transition-all ${
                      selectedTier === id
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                        {icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {tier.name}
                        </h4>
                        <p className="text-xs" style={{ color: "#ABA4AA" }}>
                          {tier.description}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {tier.features.slice(0, 3).map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-zinc-300"
                        >
                          <Check className="h-3 w-3 text-sky-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      <div className="text-xs" style={{ color: "#ABA4AA" }}>
                        +{tier.features.length - 3} more features
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Client Limit Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                How many clients do you coach?
              </h3>
              <div className="flex gap-3">
                {clientLimits.map(limit => (
                  <button
                    key={limit}
                    onClick={() => setSelectedClientLimit(limit)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      selectedClientLimit === limit
                        ? "bg-sky-500 text-white"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                  >
                    {limit} clients
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div
              className="mb-8 p-6 rounded-xl border"
              style={{ backgroundColor: "#1a1f20", borderColor: "#606364" }}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {currentTier.name} Plan
                </h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">
                    ${currentPrice}
                  </span>
                  <span className="text-lg" style={{ color: "#ABA4AA" }}>
                    /month
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#ABA4AA" }}>
                  For up to {selectedClientLimit} clients • $
                  {(currentPrice / selectedClientLimit).toFixed(2)} per client
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div
              className="flex items-center justify-center gap-6 text-xs"
              style={{ color: "#ABA4AA" }}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Monthly billing</span>
              </div>
            </div>

            {/* Subscription Change Notice */}
            <div className="mt-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs" style={{ color: "#ABA4AA" }}>
                  <p className="font-semibold text-yellow-400 mb-1">
                    Subscription Changes
                  </p>
                  <p>
                    Please allow up to 30 minutes for subscription changes to take effect. Your account will be updated automatically once processing is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 p-6 border-t"
            style={{ borderColor: "#606364", backgroundColor: "#2A3133" }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: "#ABA4AA" }}>
                You'll be charged ${currentPrice}/month starting today
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: "#ABA4AA" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectPlan}
                  className="group inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "#0ea5e9" }}
                >
                  <CreditCard className="h-4 w-4" />
                  Subscribe Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
