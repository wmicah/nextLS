/**
 * Stripe Configuration and Utilities
 * Handles Stripe integration for subscription management
 */

import Stripe from "stripe";
import { config } from "./env";

// Initialize Stripe
export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

// Stripe Price IDs for different tiers and client limits
export const STRIPE_PRICE_IDS = {
  // Standard Tier
  STANDARD_10_CLIENTS: "price_standard_10_clients",
  STANDARD_25_CLIENTS: "price_standard_25_clients",
  STANDARD_50_CLIENTS: "price_standard_50_clients",
  STANDARD_100_CLIENTS: "price_standard_100_clients",
  STANDARD_200_CLIENTS: "price_standard_200_clients",
  STANDARD_500_CLIENTS: "price_standard_500_clients",
  STANDARD_1000_CLIENTS: "price_standard_1000_clients",

  // Master Library Tier
  MASTER_LIBRARY_10_CLIENTS: "price_master_library_10_clients",
  MASTER_LIBRARY_25_CLIENTS: "price_master_library_25_clients",
  MASTER_LIBRARY_50_CLIENTS: "price_master_library_50_clients",
  MASTER_LIBRARY_100_CLIENTS: "price_master_library_100_clients",
  MASTER_LIBRARY_200_CLIENTS: "price_master_library_200_clients",
  MASTER_LIBRARY_500_CLIENTS: "price_master_library_500_clients",
  MASTER_LIBRARY_1000_CLIENTS: "price_master_library_1000_clients",

  // Premade Routines Tier (Future)
  PREMADE_ROUTINES_10_CLIENTS: "price_premade_routines_10_clients",
  PREMADE_ROUTINES_25_CLIENTS: "price_premade_routines_25_clients",
  PREMADE_ROUTINES_50_CLIENTS: "price_premade_routines_50_clients",
  PREMADE_ROUTINES_100_CLIENTS: "price_premade_routines_100_clients",
  PREMADE_ROUTINES_200_CLIENTS: "price_premade_routines_200_clients",
  PREMADE_ROUTINES_500_CLIENTS: "price_premade_routines_500_clients",
  PREMADE_ROUTINES_1000_CLIENTS: "price_premade_routines_1000_clients",
} as const;

// Mapping from tier and client limit to Stripe price ID
export function getStripePriceId(tier: string, clientLimit: number): string {
  const key =
    `${tier.toUpperCase()}_${clientLimit}_CLIENTS` as keyof typeof STRIPE_PRICE_IDS;
  return STRIPE_PRICE_IDS[key] || STRIPE_PRICE_IDS.STANDARD_10_CLIENTS;
}

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(
  email: string,
  name?: string,
  userId?: string
): Promise<Stripe.Customer> {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId || "",
      },
    });

    return customer;
  } catch (error) {
    console.error("Error creating/retrieving Stripe customer:", error);
    throw new Error("Failed to create Stripe customer");
  }
}

// Create Stripe subscription
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  trialDays?: number
): Promise<Stripe.Subscription> {
  try {
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    };

    if (trialDays && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);
    return subscription;
  } catch (error) {
    console.error("Error creating Stripe subscription:", error);
    throw new Error("Failed to create subscription");
  }
}

// Update Stripe subscription
export async function updateStripeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating Stripe subscription:", error);
    throw new Error("Failed to update subscription");
  }
}

// Cancel Stripe subscription
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return subscription;
  } catch (error) {
    console.error("Error canceling Stripe subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

// Create Stripe checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  trialDays?: number
): Promise<Stripe.Checkout.Session> {
  try {
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
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
    };

    if (trialDays && trialDays > 0) {
      sessionData.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}

// Create Stripe billing portal session
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    throw new Error("Failed to create billing portal session");
  }
}

// Verify Stripe webhook signature
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
    return event;
  } catch (error) {
    console.error("Error verifying Stripe webhook:", error);
    throw new Error("Invalid webhook signature");
  }
}

// Get subscription status from Stripe
export async function getStripeSubscriptionStatus(
  subscriptionId: string
): Promise<Stripe.Subscription.Status> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.status;
  } catch (error) {
    console.error("Error retrieving subscription status:", error);
    throw new Error("Failed to retrieve subscription status");
  }
}

// Utility function to convert cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// Utility function to convert dollars to cents
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Get subscription tier from Stripe price ID
export function getTierFromPriceId(priceId: string): {
  tier: string;
  clientLimit: number;
} {
  const priceIdMap: Record<string, { tier: string; clientLimit: number }> = {
    [STRIPE_PRICE_IDS.STANDARD_10_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 10,
    },
    [STRIPE_PRICE_IDS.STANDARD_25_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 25,
    },
    [STRIPE_PRICE_IDS.STANDARD_50_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 50,
    },
    [STRIPE_PRICE_IDS.STANDARD_100_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 100,
    },
    [STRIPE_PRICE_IDS.STANDARD_200_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 200,
    },
    [STRIPE_PRICE_IDS.STANDARD_500_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 500,
    },
    [STRIPE_PRICE_IDS.STANDARD_1000_CLIENTS]: {
      tier: "STANDARD",
      clientLimit: 1000,
    },

    [STRIPE_PRICE_IDS.MASTER_LIBRARY_10_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 10,
    },
    [STRIPE_PRICE_IDS.MASTER_LIBRARY_25_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 25,
    },
    [STRIPE_PRICE_IDS.MASTER_LIBRARY_50_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 50,
    },
    [STRIPE_PRICE_IDS.MASTER_LIBRARY_100_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 100,
    },
    [STRIPE_PRICE_IDS.MASTER_LIBRARY_200_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 200,
    },
    [STRIPE_PRICE_IDS.MASTER_LIBRARY_500_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 500,
    },
    [STRIPE_PRICE_IDS.MASTER_LIBRARY_1000_CLIENTS]: {
      tier: "MASTER_LIBRARY",
      clientLimit: 1000,
    },

    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_10_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 10,
    },
    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_25_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 25,
    },
    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_50_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 50,
    },
    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_100_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 100,
    },
    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_200_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 200,
    },
    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_500_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 500,
    },
    [STRIPE_PRICE_IDS.PREMADE_ROUTINES_1000_CLIENTS]: {
      tier: "PREMADE_ROUTINES",
      clientLimit: 1000,
    },
  };

  return priceIdMap[priceId] || { tier: "STANDARD", clientLimit: 10 };
}
