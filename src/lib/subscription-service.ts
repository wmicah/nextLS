/**
 * Subscription Service
 * Handles subscription management, usage tracking, and feature access
 */

import { db } from "@/db";
import { stripe, getStripePriceId, getTierFromPriceId } from "./stripe";
import {
  getPricing,
  getRecommendedClientLimit,
  type SubscriptionTier,
  type ClientLimit,
} from "./pricing";
import {
  // SubscriptionStatus,
  SubscriptionTier as PrismaSubscriptionTier,
  UsageMetric,
} from "@prisma/client";

// Define SubscriptionStatus locally to avoid Prisma client issues
const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  PAST_DUE: "PAST_DUE",
  UNPAID: "UNPAID",
  INCOMPLETE: "INCOMPLETE",
} as const;

export class SubscriptionService {
  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string) {
    return await db.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            clientLimit: true,
          },
        },
        usageRecords: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    clientLimit: ClientLimit,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string
  ) {
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    return await db.subscription.create({
      data: {
        userId,
        stripeSubscriptionId,
        stripeCustomerId,
        stripePriceId,
        tier: tier as PrismaSubscriptionTier,
        status: SubscriptionStatus.ACTIVE,
        clientLimit,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    updates: {
      tier?: SubscriptionTier;
      clientLimit?: ClientLimit;
      status?: SubscriptionStatus;
      stripePriceId?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: Date;
    }
  ) {
    return await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...updates,
        tier: updates.tier as PrismaSubscriptionTier,
      },
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ) {
    return await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        status: cancelAtPeriodEnd
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.CANCELED,
      },
    });
  }

  /**
   * Record usage for a specific metric
   */
  static async recordUsage(
    subscriptionId: string,
    metric: UsageMetric,
    value: number
  ) {
    return await db.usageRecord.create({
      data: {
        subscriptionId,
        metric,
        value,
      },
    });
  }

  /**
   * Get current usage for a subscription
   */
  static async getCurrentUsage(subscriptionId: string) {
    const usage = await db.usageRecord.findMany({
      where: { subscriptionId },
      orderBy: { recordedAt: "desc" },
    });

    // Group by metric and get the latest value for each
    const currentUsage: Record<UsageMetric, number> = {
      CLIENT_COUNT: 0,
      PROGRAM_CREATED: 0,
      VIDEO_UPLOADED: 0,
      MESSAGE_SENT: 0,
      LIBRARY_ACCESS: 0,
      ROUTINE_ACCESS: 0,
    };

    usage.forEach(record => {
      if (
        !currentUsage[record.metric] ||
        currentUsage[record.metric] < record.value
      ) {
        currentUsage[record.metric] = record.value;
      }
    });

    return currentUsage;
  }

  /**
   * Check if user has access to a feature
   */
  static async hasFeatureAccess(
    userId: string,
    feature: string
  ): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return false;
    }

    // Check if subscription is active
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    // Check tier-based feature access
    const tier = subscription.tier as SubscriptionTier;

    switch (feature) {
      case "master_library":
        return tier === "MASTER_LIBRARY" || tier === "PREMADE_ROUTINES";
      case "premade_routines":
        return tier === "PREMADE_ROUTINES";
      case "advanced_analytics":
        return tier === "MASTER_LIBRARY" || tier === "PREMADE_ROUTINES";
      case "priority_support":
        return tier === "MASTER_LIBRARY" || tier === "PREMADE_ROUTINES";
      case "api_access":
        return tier === "PREMADE_ROUTINES";
      default:
        return true; // Basic features are available to all tiers
    }
  }

  /**
   * Check if user can add more clients
   */
  static async canAddClient(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return false;
    }

    const currentUsage = await this.getCurrentUsage(subscription.id);
    const clientCount = currentUsage.CLIENT_COUNT;

    return clientCount < subscription.clientLimit;
  }

  /**
   * Get client count for a user
   */
  static async getClientCount(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return 0;
    }

    const currentUsage = await this.getCurrentUsage(subscription.id);
    return currentUsage.CLIENT_COUNT;
  }

  /**
   * Update client count
   */
  static async updateClientCount(userId: string, newCount: number) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new Error("No subscription found");
    }

    await this.recordUsage(subscription.id, UsageMetric.CLIENT_COUNT, newCount);

    // Also update the user's client limit if needed
    const recommendedLimit = getRecommendedClientLimit(newCount);
    if (recommendedLimit > subscription.clientLimit) {
      await this.updateSubscription(subscription.id, {
        clientLimit: recommendedLimit as ClientLimit,
      });
    }
  }

  /**
   * Get upgrade recommendations
   */
  static async getUpgradeRecommendations(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return [];
    }

    const currentUsage = await this.getCurrentUsage(subscription.id);
    const clientCount = currentUsage.CLIENT_COUNT;
    const currentTier = subscription.tier as SubscriptionTier;

    const recommendations = [];

    // Check if they need more client capacity
    if (clientCount >= subscription.clientLimit * 0.8) {
      const nextLimit = getRecommendedClientLimit(clientCount + 5);
      if (nextLimit > subscription.clientLimit) {
        recommendations.push({
          type: "capacity",
          tier: currentTier,
          clientLimit: nextLimit,
          price: getPricing(currentTier, nextLimit),
          reason: `You're approaching your client limit (${clientCount}/${subscription.clientLimit})`,
        });
      }
    }

    // Check if they should upgrade tiers
    if (currentTier === "STANDARD") {
      recommendations.push({
        type: "tier",
        tier: "MASTER_LIBRARY",
        clientLimit: subscription.clientLimit,
        price: getPricing(
          "MASTER_LIBRARY",
          subscription.clientLimit as ClientLimit
        ),
        reason: "Unlock Master Library features",
      });
    } else if (currentTier === "MASTER_LIBRARY") {
      recommendations.push({
        type: "tier",
        tier: "PREMADE_ROUTINES",
        clientLimit: subscription.clientLimit,
        price: getPricing(
          "PREMADE_ROUTINES",
          subscription.clientLimit as ClientLimit
        ),
        reason: "Unlock Premade Routines features",
      });
    }

    return recommendations;
  }

  /**
   * Create checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    clientLimit: ClientLimit,
    successUrl: string,
    cancelUrl: string
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get or create Stripe customer
    const customer = await stripe.customers.retrieve(
      user.stripeCustomerId || ""
    );
    if (!customer || customer.deleted) {
      throw new Error("Stripe customer not found");
    }

    const priceId = getStripePriceId(tier, clientLimit);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        tier,
        clientLimit: clientLimit.toString(),
      },
    });

    return session;
  }

  /**
   * Handle successful subscription creation
   */
  static async handleSubscriptionCreated(
    userId: string,
    stripeSubscriptionId: string,
    stripePriceId: string
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );
    const { tier, clientLimit } = getTierFromPriceId(stripePriceId);

    // Create subscription record
    const subscription = await this.createSubscription(
      userId,
      tier as SubscriptionTier,
      clientLimit as ClientLimit,
      stripeSubscription.customer as string,
      stripeSubscriptionId,
      stripePriceId
    );

    // Update user record
    await db.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId,
        stripePriceId,
        subscriptionTier: tier as PrismaSubscriptionTier,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        clientLimit,
      },
    });

    return subscription;
  }

  /**
   * Handle subscription updates
   */
  static async handleSubscriptionUpdated(
    stripeSubscriptionId: string,
    updates: {
      status?: string;
      current_period_start?: number;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
      canceled_at?: number;
    }
  ) {
    const subscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const updateData: any = {};

    if (updates.status) {
      updateData.status = updates.status.toUpperCase() as SubscriptionStatus;
    }

    if (updates.current_period_start) {
      updateData.currentPeriodStart = new Date(
        updates.current_period_start * 1000
      );
    }

    if (updates.current_period_end) {
      updateData.currentPeriodEnd = new Date(updates.current_period_end * 1000);
    }

    if (updates.cancel_at_period_end !== undefined) {
      updateData.cancelAtPeriodEnd = updates.cancel_at_period_end;
    }

    if (updates.canceled_at) {
      updateData.canceledAt = new Date(updates.canceled_at * 1000);
    }

    await this.updateSubscription(subscription.id, updateData);

    // Update user record
    await db.user.update({
      where: { id: subscription.userId },
      data: {
        subscriptionStatus: updateData.status || subscription.status,
      },
    });
  }
}
