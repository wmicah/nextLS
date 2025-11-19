"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";

interface OrganizationInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onSuccess?: () => void;
}

export default function OrganizationInviteModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onSuccess,
}: OrganizationInviteModalProps) {
  const [email, setEmail] = useState("");

  const inviteCoachMutation = trpc.organization.inviteCoach.useMutation({
    onSuccess: () => {
      toast.success(`Invitation sent to ${email}!`);
      setEmail("");
      onClose();
      onSuccess?.();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email address is required");
      return;
    }

    inviteCoachMutation.mutate({
      organizationId,
      coachEmail: email.trim(),
    });
  };

  const handleClose = () => {
    if (!inviteCoachMutation.isPending) {
      setEmail("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Coach
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join <strong>{organizationName}</strong>. The
            coach will receive a notification and can accept or decline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Coach Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coach@example.com"
                disabled={inviteCoachMutation.isPending}
                className="pl-10"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviteCoachMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteCoachMutation.isPending}>
              {inviteCoachMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
