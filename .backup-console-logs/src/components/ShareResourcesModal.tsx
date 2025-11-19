"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Dumbbell, Loader2, Share2 } from "lucide-react";

interface ShareResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  resourceType: "PROGRAM" | "ROUTINE";
  onSuccess: () => void;
}

export default function ShareResourcesModal({
  isOpen,
  onClose,
  organizationId,
  resourceType,
  onSuccess,
}: ShareResourcesModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: programs = [], isLoading: loadingPrograms } =
    trpc.organization.getUnsharablePrograms.useQuery(undefined, {
      enabled: isOpen && resourceType === "PROGRAM",
    });

  const { data: routines = [], isLoading: loadingRoutines } =
    trpc.organization.getUnsharableRoutines.useQuery(undefined, {
      enabled: isOpen && resourceType === "ROUTINE",
    });

  const shareResourcesMutation =
    trpc.organization.shareMultipleResources.useMutation({
      onSuccess: data => {
        toast.success(
          `Successfully shared ${data.count} ${
            resourceType === "PROGRAM" ? "program(s)" : "routine(s)"
          }!`
        );
        setSelectedIds([]);
        onSuccess();
        onClose();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Failed to share resources");
      },
    });

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const items = resourceType === "PROGRAM" ? programs : routines;
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item: any) => item.id));
    }
  };

  const handleShare = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one resource to share");
      return;
    }

    shareResourcesMutation.mutate({
      resourceType,
      resourceIds: selectedIds,
      organizationId,
    });
  };

  const isLoading =
    resourceType === "PROGRAM" ? loadingPrograms : loadingRoutines;
  const items = resourceType === "PROGRAM" ? programs : routines;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {resourceType === "PROGRAM" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <Dumbbell className="h-5 w-5" />
            )}
            Share {resourceType === "PROGRAM" ? "Programs" : "Routines"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No {resourceType === "PROGRAM" ? "programs" : "routines"}{" "}
                available to share.
                {resourceType === "PROGRAM"
                  ? " All your programs are already shared."
                  : " All your routines are already shared."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.length === items.length}
                    onChange={handleSelectAll}
                    id="select-all"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All ({items.length})
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedIds.length} selected
                </p>
              </div>

              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleToggle(item.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleToggle(item.id)}
                    id={item.id}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={item.id}
                      className="font-medium text-sm cursor-pointer block"
                    >
                      {resourceType === "PROGRAM" ? item.title : item.name}
                    </label>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    {resourceType === "ROUTINE" && item.exercises && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.exercises.length} exercises
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={
              selectedIds.length === 0 || shareResourcesMutation.isPending
            }
          >
            {shareResourcesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share {selectedIds.length > 0 && `(${selectedIds.length})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
