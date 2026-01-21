"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Crown,
  Library,
  Clock,
} from "lucide-react";
// import PaywallModal from "./PaywallModal";

export default function BillingDashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Subscription functionality temporarily disabled
  const subscription = {
    tier: "STANDARD",
    status: "ACTIVE",
    clientLimit: 10,
    currentPeriodEnd: new Date(),
    cancelAtPeriodEnd: false,
  };
  const subscriptionLoading = false;
  const usageStats = {
    currentUsage: {
      CLIENT_COUNT: 0,
      PROGRAM_CREATED: 0,
      VIDEO_UPLOADED: 0,
      MESSAGE_SENT: 0,
      LIBRARY_ACCESS: 0,
      ROUTINE_ACCESS: 0,
    },
  };
  const usageLoading = false;
  const recommendations: any[] = [];

  // Subscription mutations temporarily disabled
  const createBillingPortalSession = {
    mutate: (data?: any) => {
    },
    isLoading: false,
    isPending: false,
  };
  
  const cancelSubscription = {
    mutate: (data?: any) => {
    },
    isLoading: false,
    isPending: false,
  };

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Mock data always available, so no null check needed
  // if (!subscription || !usageStats) {
  //   return (
  //     <div className="text-center p-8">
  //       <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
  //       <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
  //         No Subscription Found
  //       </h3>
  //       <p className="text-gray-500 mb-4">
  //         You don't have an active subscription. Choose a plan to get started.
  //       </p>
  //       <Button onClick={() => setShowUpgradeModal(true)}>Choose a Plan</Button>
  //     </div>
  //   );
  // }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "STANDARD":
        return <Users className="h-5 w-5" />;
      case "MASTER_LIBRARY":
        return <Library className="h-5 w-5" />;
      case "PREMADE_ROUTINES":
        return <Crown className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "STANDARD":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "MASTER_LIBRARY":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "PREMADE_ROUTINES":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "CANCELED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PAST_DUE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getTierIcon(subscription.tier)}
                <span className="font-medium">Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getTierColor(subscription.tier)}>
                  {subscription.tier.replace("_", " ")}
                </Badge>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
            </div>

            {/* Client Limit */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">Client Limit</span>
              </div>
              <div className="text-2xl font-bold">
                {usageStats.currentUsage.CLIENT_COUNT} /{" "}
                {subscription.clientLimit}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (usageStats.currentUsage.CLIENT_COUNT /
                        subscription.clientLimit) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Next Billing */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Next Billing</span>
              </div>
              <div className="text-lg">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
              {subscription.cancelAtPeriodEnd && (
                <Badge variant="destructive" className="text-xs">
                  Cancels at period end
                </Badge>
              )}
            </div>
          </div>

          {/* Subscription Change Notice */}
          <div className="mt-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-400 mb-1">
                  Subscription Changes
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Please allow up to 30 minutes for subscription changes to take effect. Your account will be updated automatically once processing is complete.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() =>
                createBillingPortalSession.mutate({
                  returnUrl: window.location.href,
                })
              }
              disabled={createBillingPortalSession.isPending}
            >
              {createBillingPortalSession.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>

            {subscription.status === "ACTIVE" &&
              !subscription.cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  onClick={() =>
                    cancelSubscription.mutate({
                      cancelAtPeriodEnd: true,
                    })
                  }
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Cancel Subscription
                </Button>
              )}

            <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>
            Track your platform usage and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {usageStats.currentUsage.CLIENT_COUNT}
              </div>
              <div className="text-sm text-gray-500">Active Clients</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {usageStats.currentUsage.PROGRAM_CREATED}
              </div>
              <div className="text-sm text-gray-500">Programs Created</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {usageStats.currentUsage.VIDEO_UPLOADED}
              </div>
              <div className="text-sm text-gray-500">Videos Uploaded</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {usageStats.currentUsage.MESSAGE_SENT}
              </div>
              <div className="text-sm text-gray-500">Messages Sent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommended Upgrades
            </CardTitle>
            <CardDescription>
              Based on your usage, we recommend these upgrades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      {rec.reason}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {rec.tier} • {rec.clientLimit} clients • ${rec.price}
                      /month
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                    Upgrade
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paywall Modal temporarily disabled */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Upgrade Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              Upgrade functionality is currently not available. Please check
              back later.
            </p>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
