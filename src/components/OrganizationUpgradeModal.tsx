"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Building2, Crown, Users, Check } from "lucide-react";
import { toast } from "sonner";

interface OrganizationUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ORGANIZATION_TIERS = [
  {
    value: "TEAM",
    label: "Team",
    description: "5 coaches, 250 clients",
    price: "$99/month",
    coaches: 5,
    clients: 250,
    features: [
      "Shared calendar view",
      "Cross-coach client assignments",
      "Shared program library",
      "Team collaboration tools",
      "Basic analytics",
    ],
    popular: false,
  },
  {
    value: "CLUB",
    label: "Club",
    description: "10 coaches, 500 clients",
    price: "$179/month",
    coaches: 10,
    clients: 500,
    features: [
      "Everything in Team",
      "Advanced organization dashboard",
      "Enhanced collaboration features",
      "Priority support",
      "Advanced analytics",
    ],
    popular: true,
  },
  {
    value: "ACADEMY",
    label: "Academy",
    description: "20 coaches, 1,000 clients",
    price: "$299/month",
    coaches: 20,
    clients: 1000,
    features: [
      "Everything in Club",
      "Custom branding options",
      "API access",
      "Dedicated account manager",
      "Enterprise features",
    ],
    popular: false,
  },
];

export default function OrganizationUpgradeModal({
  isOpen,
  onClose,
  onSuccess,
}: OrganizationUpgradeModalProps) {
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<
    "TEAM" | "CLUB" | "ACADEMY" | null
  >(null);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    description: "",
  });

  const createOrganizationMutation = trpc.organization.create.useMutation({
    onSuccess: async data => {
      console.log("Organization created successfully:", data);

      // Invalidate and refetch organization queries
      await queryClient.invalidateQueries({
        queryKey: [["organization", "get"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["organization", "getSharedResources"]],
      });

      toast.success("Organization created successfully!");
      setSelectedTier(null);
      setShowOrgForm(false);
      setOrgFormData({ name: "", description: "" });
      onClose();
      onSuccess?.();
    },
    onError: (error: { message?: string }) => {
      console.error("Failed to create organization:", error);
      toast.error(error.message || "Failed to create organization");
    },
  });

  const handleTierSelect = (tier: "TEAM" | "CLUB" | "ACADEMY") => {
    setSelectedTier(tier);
    setShowOrgForm(true);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgFormData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!selectedTier) {
      toast.error("Please select a tier");
      return;
    }

    createOrganizationMutation.mutate({
      name: orgFormData.name.trim(),
      description: orgFormData.description.trim() || undefined,
      tier: selectedTier,
    });
  };

  const handleClose = () => {
    if (!createOrganizationMutation.isPending) {
      setSelectedTier(null);
      setShowOrgForm(false);
      setOrgFormData({ name: "", description: "" });
      onClose();
    }
  };

  const selectedTierData = selectedTier
    ? ORGANIZATION_TIERS.find(t => t.value === selectedTier)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {!showOrgForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Upgrade to Organization
              </DialogTitle>
              <DialogDescription>
                Choose a plan that fits your coaching needs. You can invite
                other coaches and collaborate on client management.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {ORGANIZATION_TIERS.map(tier => (
                <div
                  key={tier.value}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    tier.popular
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() =>
                    handleTierSelect(tier.value as "TEAM" | "CLUB" | "ACADEMY")
                  }
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{tier.label}</h3>
                      <p className="text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{tier.price}</div>
                      <div className="text-sm text-muted-foreground">
                        per month
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                  >
                    Choose {tier.label}
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Create Your Organization
              </DialogTitle>
              <DialogDescription>
                You've selected the <strong>{selectedTierData?.label}</strong>{" "}
                plan. Now let's set up your organization details.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOrgSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={orgFormData.name}
                  onChange={e =>
                    setOrgFormData({ ...orgFormData, name: e.target.value })
                  }
                  placeholder="e.g., Next Level Softball Academy"
                  disabled={createOrganizationMutation.isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={orgFormData.description}
                  onChange={e =>
                    setOrgFormData({
                      ...orgFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Tell us about your organization..."
                  disabled={createOrganizationMutation.isPending}
                  rows={3}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  Selected Plan: {selectedTierData?.label}
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• {selectedTierData?.coaches} coaches</div>
                  <div>• {selectedTierData?.clients} clients</div>
                  <div>• {selectedTierData?.price}/month</div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOrgForm(false)}
                  disabled={createOrganizationMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createOrganizationMutation.isPending}
                >
                  {createOrganizationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Organization
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
