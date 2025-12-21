/**
 * Pricing Configuration for NextLevel Coaching Platform
 * Defines subscription tiers, pricing, and feature access
 */

export type SubscriptionTier =
  | "STANDARD"
  | "MASTER_LIBRARY"
  | "PREMADE_ROUTINES";
export type ClientLimit = 10 | 25 | 50 | 100 | 200 | 500 | 1000;

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  clientLimits: ClientLimit[];
  pricing: Record<ClientLimit, number>;
  features: string[];
  color: string;
  icon: string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  clientLimit: ClientLimit;
  price: number;
  features: string[];
}

// Standard Tier - Base platform features
export const STANDARD_TIER: PricingTier = {
  id: "standard",
  name: "Standard",
  description: "Core coaching platform with essential features",
  clientLimits: [10, 25, 50, 100, 200],
  pricing: {
    10: 25, // $25/month
    25: 55, // $55/month
    50: 95, // $95/month
    100: 150, // $150/month
    200: 250, // $250/month
    500: 400, // $400/month
    1000: 600, // $600/month
  },
  features: [
    "Client management",
    "Program creation",
    "Workout scheduling",
    "Video assignments",
    "Messaging system",
    "Basic analytics",
    "Progress tracking",
    "Calendar integration",
  ],
  color: "blue",
  icon: "users",
};

// Master Library Tier - Access to expert content
export const MASTER_LIBRARY_TIER: PricingTier = {
  id: "master_library",
  name: "Master Library",
  description: "Everything in Standard plus access to expert-created content",
  clientLimits: [10, 25, 50, 100, 200, 500],
  pricing: {
    10: 50, // $50/month
    25: 85, // $85/month
    50: 140, // $140/month
    100: 220, // $220/month
    200: 380, // $380/month
    500: 650, // $650/month
    1000: 900, // $900/month
  },
  features: [
    "Everything in Standard",
    "Master library access",
    "Expert-created drills",
    "Advanced program templates",
    "Professional exercise library",
    "Video technique library",
    "Sport-specific content",
    "Priority support",
  ],
  color: "purple",
  icon: "library",
};

// Premade Routines Tier - Complete program packages (Future)
export const PREMADE_ROUTINES_TIER: PricingTier = {
  id: "premade_routines",
  name: "Premade Routines",
  description: "Everything in Master Library plus complete program packages",
  clientLimits: [10, 25, 50, 100, 200, 500],
  pricing: {
    10: 75, // $75/month
    25: 125, // $125/month
    50: 200, // $200/month
    100: 320, // $320/month
    200: 550, // $550/month
    500: 850, // $850/month
    1000: 1200, // $1200/month
  },
  features: [
    "Everything in Master Library",
    "Complete program packages",
    "Seasonal training plans",
    "Sport-specific routines",
    "Ready-to-use workout sequences",
    "Custom program modifications",
    "White-label options",
    "API access",
  ],
  color: "gold",
  icon: "crown",
};

export const PRICING_TIERS: Record<SubscriptionTier, PricingTier> = {
  STANDARD: STANDARD_TIER,
  MASTER_LIBRARY: MASTER_LIBRARY_TIER,
  PREMADE_ROUTINES: PREMADE_ROUTINES_TIER,
};

/**
 * Get pricing for a specific tier and client limit
 */
export function getPricing(
  tier: SubscriptionTier,
  clientLimit: ClientLimit
): number {
  return PRICING_TIERS[tier].pricing[clientLimit];
}

/**
 * Get all available client limits for a tier
 */
export function getClientLimits(tier: SubscriptionTier): ClientLimit[] {
  return PRICING_TIERS[tier].clientLimits;
}

/**
 * Get the next tier up from current
 */
export function getNextTier(
  currentTier: SubscriptionTier
): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = [
    "STANDARD",
    "MASTER_LIBRARY",
    "PREMADE_ROUTINES",
  ];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

/**
 * Get the previous tier down from current
 */
export function getPreviousTier(
  currentTier: SubscriptionTier
): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = [
    "STANDARD",
    "MASTER_LIBRARY",
    "PREMADE_ROUTINES",
  ];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex > 0 ? tiers[currentIndex - 1] : null;
}

/**
 * Check if a tier has access to a specific feature
 */
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: string
): boolean {
  const tierConfig = PRICING_TIERS[tier];
  return tierConfig.features.includes(feature);
}

/**
 * Check if a user's tier has access to a feature tier level
 * Higher tiers automatically get access to lower tier features
 * 
 * Tier hierarchy:
 * - STANDARD: Base features only
 * - MASTER_LIBRARY: Includes STANDARD + Master Library features
 * - PREMADE_ROUTINES: Includes STANDARD + MASTER_LIBRARY + Premade Routines features
 */
export function hasTierAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy: SubscriptionTier[] = [
    "STANDARD",
    "MASTER_LIBRARY",
    "PREMADE_ROUTINES",
  ];

  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  // If tier not found, deny access
  if (userTierIndex === -1 || requiredTierIndex === -1) {
    return false;
  }

  // User has access if their tier is equal to or higher than required tier
  return userTierIndex >= requiredTierIndex;
}

/**
 * Get the recommended client limit for a given number of clients
 */
export function getRecommendedClientLimit(clientCount: number): ClientLimit {
  const limits: ClientLimit[] = [10, 25, 50, 100, 200, 500, 1000];

  for (const limit of limits) {
    if (clientCount <= limit) {
      return limit;
    }
  }

  return 1000; // Max limit
}

/**
 * Calculate savings when upgrading tiers
 */
export function calculateSavings(
  currentTier: SubscriptionTier,
  currentLimit: ClientLimit,
  newTier: SubscriptionTier,
  newLimit: ClientLimit
): number {
  const currentPrice = getPricing(currentTier, currentLimit);
  const newPrice = getPricing(newTier, newLimit);
  return Math.max(0, currentPrice - newPrice);
}

/**
 * Get feature comparison between tiers
 */
export function getFeatureComparison(): Record<
  string,
  Record<SubscriptionTier, boolean>
> {
  const allFeatures = new Set<string>();

  // Collect all features from all tiers
  Object.values(PRICING_TIERS).forEach(tier => {
    tier.features.forEach(feature => allFeatures.add(feature));
  });

  const comparison: Record<string, Record<SubscriptionTier, boolean>> = {};

  allFeatures.forEach(feature => {
    comparison[feature] = {
      STANDARD: hasFeatureAccess("STANDARD", feature),
      MASTER_LIBRARY: hasFeatureAccess("MASTER_LIBRARY", feature),
      PREMADE_ROUTINES: hasFeatureAccess("PREMADE_ROUTINES", feature),
    };
  });

  return comparison;
}

/**
 * Get upgrade recommendations based on current usage
 */
export function getUpgradeRecommendations(
  currentTier: SubscriptionTier,
  currentClientCount: number
): {
  tier: SubscriptionTier;
  clientLimit: ClientLimit;
  price: number;
  reason: string;
}[] {
  const recommendations: {
    tier: SubscriptionTier;
    clientLimit: ClientLimit;
    price: number;
    reason: string;
  }[] = [];

  // Check if they need more client capacity
  const currentLimit = getRecommendedClientLimit(currentClientCount);
  if (currentClientCount >= currentLimit * 0.8) {
    // 80% capacity
    const nextLimit = getRecommendedClientLimit(currentClientCount + 5);
    if (nextLimit > currentLimit) {
      recommendations.push({
        tier: currentTier,
        clientLimit: nextLimit,
        price: getPricing(currentTier, nextLimit),
        reason: `You're approaching your client limit (${currentClientCount}/${currentLimit})`,
      });
    }
  }

  // Check if they should upgrade tiers
  const nextTier = getNextTier(currentTier);
  if (nextTier) {
    recommendations.push({
      tier: nextTier,
      clientLimit: currentLimit,
      price: getPricing(nextTier, currentLimit),
      reason: `Unlock ${PRICING_TIERS[nextTier].name} features`,
    });
  }

  return recommendations;
}
