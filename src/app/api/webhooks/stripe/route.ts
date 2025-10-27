/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for subscription management
 *
 * TEMPORARILY DISABLED - Stripe implementation not ready
 */

import { NextRequest, NextResponse } from "next/server";
// import { headers } from "next/headers";
// import { stripe, verifyStripeWebhook } from "@/lib/stripe";
// import { SubscriptionService } from "@/lib/subscription-service";
// import { db } from "@/db";
// import { SubscriptionStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  // TEMPORARILY DISABLED - Return success to prevent webhook failures
  return NextResponse.json({
    received: true,
    message: "Stripe webhook temporarily disabled",
  });
}

/*
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyStripeWebhook(body, signature);

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const { userId, tier, clientLimit } = subscription.metadata;

    if (!userId) {
      console.error("No userId in subscription metadata");
      return;
    }

    await SubscriptionService.handleSubscriptionCreated(
      userId,
      subscription.id,
      subscription.items.data[0].price.id
    );

    console.log(`Subscription created for user ${userId}`);
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    await SubscriptionService.handleSubscriptionUpdated(subscription.id, {
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
    });

    console.log(`Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const dbSubscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscription) {
      await SubscriptionService.updateSubscription(dbSubscription.id, {
        status: "CANCELED" as any,
        canceledAt: new Date(),
      });

      // Update user record
      await db.user.update({
        where: { id: dbSubscription.userId },
        data: {
          subscriptionStatus: "CANCELED" as any,
        },
      });
    }

    console.log(`Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (subscription) {
      // Create invoice record
      await db.invoice.create({
        data: {
          subscriptionId: subscription.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: "PAID",
          paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        },
      });

      // Update subscription status if it was past due
      if (subscription.status === "PAST_DUE") {
        await SubscriptionService.updateSubscription(subscription.id, {
          status: "ACTIVE" as any,
        });
      }
    }

    console.log(`Invoice payment succeeded: ${invoice.id}`);
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (subscription) {
      // Create invoice record
      await db.invoice.create({
        data: {
          subscriptionId: subscription.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: "OPEN",
          dueDate: new Date(invoice.due_date * 1000),
        },
      });

      // Update subscription status to past due
      await SubscriptionService.updateSubscription(subscription.id, {
        status: "PAST_DUE" as any,
      });
    }

    console.log(`Invoice payment failed: ${invoice.id}`);
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

async function handleTrialWillEnd(subscription: any) {
  try {
    const dbSubscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true },
    });

    if (dbSubscription) {
      // Send notification to user about trial ending
      // This could trigger an email or in-app notification
      console.log(`Trial ending soon for user: ${dbSubscription.user.email}`);

      // You could add notification logic here
      // await sendTrialEndingNotification(dbSubscription.user);
    }

    console.log(`Trial will end: ${subscription.id}`);
  } catch (error) {
    console.error("Error handling trial will end:", error);
  }
}
*/
