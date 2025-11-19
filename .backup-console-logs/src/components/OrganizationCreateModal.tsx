"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface OrganizationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ORGANIZATION_TIERS = [
  {
    value: "SOLO",
    label: "Solo Coach",
    description: "1 coach, 50 clients",
    price: "$29/month",
  },
  {
    value: "TEAM",
    label: "Team",
    description: "5 coaches, 250 clients",
    price: "$99/month",
  },
  {
    value: "CLUB",
    label: "Club",
    description: "10 coaches, 500 clients",
    price: "$179/month",
  },
  {
    value: "ACADEMY",
    label: "Academy",
    description: "20 coaches, 1,000 clients",
    price: "$299/month",
  },
];

export default function OrganizationCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: OrganizationCreateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tier: "SOLO" as "SOLO" | "TEAM" | "CLUB" | "ACADEMY",
  });

  const createOrganizationMutation = trpc.organization.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully!");
      setFormData({ name: "", description: "", tier: "SOLO" });
      onClose();
      onSuccess?.();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    createOrganizationMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      tier: formData.tier,
    });
  };

  const handleClose = () => {
    if (!createOrganizationMutation.isPending) {
      setFormData({ name: "", description: "", tier: "SOLO" });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Organization
          </DialogTitle>
          <DialogDescription>
            Set up your coaching organization to collaborate with other coaches
            and share resources.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Next Level Softball Academy"
              disabled={createOrganizationMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell us about your organization..."
              disabled={createOrganizationMutation.isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">Organization Tier</Label>
            <Select
              value={formData.tier}
              onValueChange={(value: "SOLO" | "TEAM" | "CLUB" | "ACADEMY") =>
                setFormData({ ...formData, tier: value })
              }
              disabled={createOrganizationMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TIERS.map(tier => (
                  <SelectItem key={tier.value} value={tier.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{tier.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {tier.description} • {tier.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createOrganizationMutation.isPending}
            >
              Cancel
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
      </DialogContent>
    </Dialog>
  );
}
