/**
 * Subscription Router
 * Handles subscription management, billing, and feature access
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { ensureUserId } from "./_helpers";
import { SubscriptionService } from "@/lib/subscription-service";
import {
  getPricing,
  getClientLimits,
  type SubscriptionTier,
  type ClientLimit,
} from "@/lib/pricing";
import { stripe, createBillingPortalSession } from "@/lib/stripe";
import { db } from "@/db";

export const subscriptionRouter = router({
  // Get current subscription
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = ensureUserId(ctx.userId);

    try {
      const subscription = await SubscriptionService.getUserSubscription(
        userId
      );
      return subscription;
    } catch (error) {
      console.error("Error fetching subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription",
      });
    }
  }),

  // Get pricing information
  getPricing: publicProcedure.query(async () => {
    return {
      tiers: {
        STANDARD: {
          name: "Standard",
          description: "Core coaching platform with essential features",
          clientLimits: getClientLimits("STANDARD"),
          pricing: {
            10: getPricing("STANDARD", 10),
            25: getPricing("STANDARD", 25),
            50: getPricing("STANDARD", 50),
            100: getPricing("STANDARD", 100),
            200: getPricing("STANDARD", 200),
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
        },
        MASTER_LIBRARY: {
          name: "Master Library",
          description:
            "Everything in Standard plus access to expert-created content",
          clientLimits: getClientLimits("MASTER_LIBRARY"),
          pricing: {
            10: getPricing("MASTER_LIBRARY", 10),
            25: getPricing("MASTER_LIBRARY", 25),
            50: getPricing("MASTER_LIBRARY", 50),
            100: getPricing("MASTER_LIBRARY", 100),
            200: getPricing("MASTER_LIBRARY", 200),
            500: getPricing("MASTER_LIBRARY", 500),
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
        },
        PREMADE_ROUTINES: {
          name: "Premade Routines",
          description:
            "Everything in Master Library plus complete program packages",
          clientLimits: getClientLimits("PREMADE_ROUTINES"),
          pricing: {
            10: getPricing("PREMADE_ROUTINES", 10),
            25: getPricing("PREMADE_ROUTINES", 25),
            50: getPricing("PREMADE_ROUTINES", 50),
            100: getPricing("PREMADE_ROUTINES", 100),
            200: getPricing("PREMADE_ROUTINES", 200),
            500: getPricing("PREMADE_ROUTINES", 500),
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
        },
      },
    };
  }),

  // Check feature access
  hasFeatureAccess: protectedProcedure
    .input(
      z.object({
        feature: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.userId);

      try {
        const hasAccess = await SubscriptionService.hasFeatureAccess(
          userId,
          input.feature
        );
        return { hasAccess };
      } catch (error) {
        console.error("Error checking feature access:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check feature access",
        });
      }
    }),

  // Check if user can add more clients
  canAddClient: protectedProcedure.query(async ({ ctx }) => {
    const userId = ensureUserId(ctx.userId);

    try {
      const canAdd = await SubscriptionService.canAddClient(userId);
      return { canAdd };
    } catch (error) {
      console.error("Error checking client limit:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check client limit",
      });
    }
  }),

  // Get current client count
  getClientCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ensureUserId(ctx.userId);

    try {
      const clientCount = await SubscriptionService.getClientCount(userId);
      return { clientCount };
    } catch (error) {
      console.error("Error getting client count:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get client count",
      });
    }
  }),

  // Get upgrade recommendations
  getUpgradeRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ensureUserId(ctx.userId);

    try {
      const recommendations =
        await SubscriptionService.getUpgradeRecommendations(userId);
      return { recommendations };
    } catch (error) {
      console.error("Error getting upgrade recommendations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get upgrade recommendations",
      });
    }
  }),

  // Create checkout session
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["STANDARD", "MASTER_LIBRARY", "PREMADE_ROUTINES"]),
        clientLimit: z.number().min(10).max(1000),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.userId);

      try {
        const session = await SubscriptionService.createCheckoutSession(
          userId,
          input.tier as SubscriptionTier,
          input.clientLimit as ClientLimit,
          input.successUrl,
          input.cancelUrl
        );

        return { sessionId: session.id, url: session.url };
      } catch (error) {
        console.error("Error creating checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Create billing portal session
  createBillingPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.userId);

      try {
        const user = await db.user.findUnique({
          where: { id: userId },
        });

        if (!user || !user.stripeCustomerId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Stripe customer not found",
          });
        }

        const session = await createBillingPortalSession(
          user.stripeCustomerId,
          input.returnUrl
        );

        return { url: session.url };
      } catch (error) {
        console.error("Error creating billing portal session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create billing portal session",
        });
      }
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        cancelAtPeriodEnd: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.userId);

      try {
        const subscription = await SubscriptionService.getUserSubscription(
          userId
        );

        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active subscription found",
          });
        }

        await SubscriptionService.cancelSubscription(
          subscription.id,
          input.cancelAtPeriodEnd
        );

        return { success: true };
      } catch (error) {
        console.error("Error canceling subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel subscription",
        });
      }
    }),

  // Update client count (for usage tracking)
  updateClientCount: protectedProcedure
    .input(
      z.object({
        clientCount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ensureUserId(ctx.userId);

      try {
        await SubscriptionService.updateClientCount(userId, input.clientCount);
        return { success: true };
      } catch (error) {
        console.error("Error updating client count:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update client count",
        });
      }
    }),

  // Get usage statistics
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ensureUserId(ctx.userId);

    try {
      const subscription = await SubscriptionService.getUserSubscription(
        userId
      );

      if (!subscription) {
        return null;
      }

      const currentUsage = await SubscriptionService.getCurrentUsage(
        subscription.id
      );

      return {
        subscription,
        currentUsage,
        clientLimit: subscription.clientLimit,
        tier: subscription.tier,
        status: subscription.status,
      };
    } catch (error) {
      console.error("Error getting usage stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get usage statistics",
      });
    }
  }),
});
