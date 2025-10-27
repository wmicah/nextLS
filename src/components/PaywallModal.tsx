"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  X,
  Crown,
  Library,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentTier?: string;
  currentClientCount?: number;
}

export default function PaywallModal({
  isOpen,
  onClose,
  feature,
  currentTier = "STANDARD",
  currentClientCount = 0,
}: PaywallModalProps) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>("MASTER_LIBRARY");
  const [selectedClientLimit, setSelectedClientLimit] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);

  const { data: pricing } = trpc.subscription.getPricing.useQuery();
  const { data: recommendations } =
    trpc.subscription.getUpgradeRecommendations.useQuery();

  const createCheckoutSession =
    trpc.subscription.createCheckoutSession.useMutation({
      onSuccess: data => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: error => {
        console.error("Error creating checkout session:", error);
        setIsLoading(false);
      },
    });

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      await createCheckoutSession.mutateAsync({
        tier: selectedTier as
          | "STANDARD"
          | "MASTER_LIBRARY"
          | "PREMADE_ROUTINES",
        clientLimit: selectedClientLimit,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/dashboard`,
      });
    } catch (error) {
      console.error("Error upgrading:", error);
      setIsLoading(false);
    }
  };

  const getFeatureDescription = (feature: string) => {
    switch (feature) {
      case "master_library":
        return "Access to our expert-created master library with professional drills, exercises, and program templates.";
      case "premade_routines":
        return "Complete program packages and ready-to-use workout sequences created by industry experts.";
      case "client_limit":
        return "You've reached your client limit. Upgrade to add more clients to your coaching roster.";
      default:
        return "This feature requires a premium subscription.";
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "master_library":
        return <Library className="h-6 w-6" />;
      case "premade_routines":
        return <Crown className="h-6 w-6" />;
      case "client_limit":
        return <Users className="h-6 w-6" />;
      default:
        return <Target className="h-6 w-6" />;
    }
  };

  if (!pricing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {getFeatureIcon(feature)}
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="text-lg">
            {getFeatureDescription(feature)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Current Plan: {currentTier}</span>
              <span className="text-sm text-blue-600 dark:text-blue-300">
                ({currentClientCount} clients)
              </span>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(pricing.tiers).map(([tierKey, tier]) => {
              const isSelected = selectedTier === tierKey;
              const isCurrentTier = currentTier === tierKey;
              const isAvailable = tierKey !== "PREMADE_ROUTINES"; // Future tier

              return (
                <Card
                  key={tierKey}
                  className={`relative cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:shadow-md"
                  } ${isCurrentTier ? "opacity-75" : ""} ${
                    !isAvailable ? "opacity-50" : ""
                  }`}
                  onClick={() =>
                    isAvailable && !isCurrentTier && setSelectedTier(tierKey)
                  }
                >
                  {isCurrentTier && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    </div>
                  )}

                  {!isAvailable && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {tierKey === "STANDARD" && <Users className="h-5 w-5" />}
                      {tierKey === "MASTER_LIBRARY" && (
                        <Library className="h-5 w-5" />
                      )}
                      {tierKey === "PREMADE_ROUTINES" && (
                        <Crown className="h-5 w-5" />
                      )}
                      {tier.name}
                    </CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Client Limit Selection */}
                      <div>
                        <label className="text-sm font-medium">
                          Client Limit
                        </label>
                        <select
                          value={
                            selectedTier === tierKey
                              ? selectedClientLimit
                              : tier.clientLimits[0]
                          }
                          onChange={e => {
                            setSelectedClientLimit(Number(e.target.value));
                            setSelectedTier(tierKey);
                          }}
                          className="w-full mt-1 p-2 border rounded-md"
                          disabled={!isAvailable || isCurrentTier}
                        >
                          {tier.clientLimits.map(limit => (
                            <option key={limit} value={limit}>
                              {limit} clients - $
                              {(tier.pricing as any)[limit] || 0}
                              /month
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Features */}
                      <div>
                        <label className="text-sm font-medium">Features</label>
                        <ul className="mt-2 space-y-1">
                          {tier.features.slice(0, 4).map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                          {tier.features.length > 4 && (
                            <li className="text-sm text-gray-500">
                              +{tier.features.length - 4} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Upgrade Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUpgrade}
              disabled={
                isLoading ||
                selectedTier === currentTier ||
                !pricing.tiers[selectedTier as keyof typeof pricing.tiers]
              }
              className="px-8 py-3 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : selectedTier === currentTier ? (
                "Current Plan"
              ) : (
                <>
                  Upgrade to{" "}
                  {
                    pricing.tiers[selectedTier as keyof typeof pricing.tiers]
                      ?.name
                  }
                  <span className="ml-2">
                    $
                    {(() => {
                      const tier =
                        pricing?.tiers[
                          selectedTier as keyof typeof pricing.tiers
                        ];
                      if (!tier) return 0;
                      return (tier.pricing as any)[selectedClientLimit] || 0;
                    })()}
                    /month
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Recommendations */}
          {recommendations && recommendations.recommendations.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Recommended for you:
              </h4>
              <ul className="space-y-1">
                {recommendations.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-sm text-yellow-700 dark:text-yellow-300"
                  >
                    • {rec.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
