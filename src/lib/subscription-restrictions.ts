/**
 * Subscription Tier Restrictions
 * 
 * This module provides utilities for enforcing subscription tier restrictions.
 * The restrictions are based on the subscription tier and client limit stored in the User model.
 * 
 * Tier Hierarchy:
 * - STANDARD: Base features, limited client count based on clientLimit
 * - MASTER_LIBRARY: Includes STANDARD + Master Library programs/routines access
 * - PREMADE_ROUTINES: Includes STANDARD + MASTER_LIBRARY + Premade Routines features
 * 
 * Note: When Stripe is integrated, the subscriptionTier and clientLimit fields
 * will be updated via webhooks. This module will automatically enforce restrictions
 * based on those values.
 */

import type { SubscriptionTier } from "./pricing";
import { hasTierAccess } from "./pricing";

export interface TierRestrictions {
  maxClients: number;
  hasMasterLibraryAccess: boolean;
  hasPremadeRoutinesAccess: boolean;
  maxPrograms?: number; // Optional limit on number of programs
  maxRoutines?: number; // Optional limit on number of routines
}

/**
 * Get restrictions for a subscription tier
 */
export function getTierRestrictions(
  tier: SubscriptionTier,
  clientLimit: number
): TierRestrictions {
  const restrictions: TierRestrictions = {
    maxClients: clientLimit,
    hasMasterLibraryAccess: hasTierAccess(tier, "MASTER_LIBRARY"),
    hasPremadeRoutinesAccess: hasTierAccess(tier, "PREMADE_ROUTINES"),
  };

  // Add program/routine limits if needed in the future
  // For now, unlimited programs/routines for all tiers

  return restrictions;
}

/**
 * Check if user can add a new client based on their subscription
 */
export function canAddClient(
  tier: SubscriptionTier,
  clientLimit: number,
  currentClientCount: number
): { allowed: boolean; reason?: string; isOverLimit?: boolean } {
  if (currentClientCount >= clientLimit) {
    const isOverLimit = currentClientCount > clientLimit;
    const message = isOverLimit
      ? `You currently have ${currentClientCount} active clients, which exceeds your limit of ${clientLimit}. You cannot add more clients until you upgrade your subscription to increase your client limit.`
      : `You have reached your client limit of ${clientLimit} active clients. Upgrade your subscription to add more clients.`;

    return {
      allowed: false,
      reason: message,
      isOverLimit,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can access master library features
 */
export function canAccessMasterLibrary(tier: SubscriptionTier): boolean {
  return hasTierAccess(tier, "MASTER_LIBRARY");
}

/**
 * Check if user can access premade routines features
 */
export function canAccessPremadeRoutines(tier: SubscriptionTier): boolean {
  return hasTierAccess(tier, "PREMADE_ROUTINES");
}

/**
 * Get a user-friendly error message for restriction violations
 */
export function getRestrictionErrorMessage(
  restriction: string,
  tier: SubscriptionTier,
  currentValue?: number,
  limit?: number
): string {
  switch (restriction) {
    case "client_limit":
      if (currentValue !== undefined && limit !== undefined) {
        const isOverLimit = currentValue > limit;
        if (isOverLimit) {
          return `You currently have ${currentValue} active clients, which exceeds your limit of ${limit}. You cannot add more clients until you upgrade your subscription to increase your client limit.`;
        }
        return `You have reached your client limit of ${limit} active client${limit === 1 ? "" : "s"}. Please upgrade your subscription to add more clients.`;
      }
      return `You have reached your client limit. Please upgrade your subscription to add more clients.`;
    case "master_library":
      return "Master Library access requires a MASTER_LIBRARY or PREMADE_ROUTINES subscription. Please upgrade to access this feature.";
    case "premade_routines":
      return "Premade Routines access requires a PREMADE_ROUTINES subscription. Please upgrade to access this feature.";
    default:
      return "This action is not allowed with your current subscription tier. Please upgrade to access this feature.";
  }
}

