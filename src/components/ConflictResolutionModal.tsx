"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, Merge, Trash2, SkipForward } from "lucide-react";
import { ConflictResolution } from "@/types/clipboard";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (type: "replace" | "merge" | "skip") => void;
  conflictData: ConflictResolution | null;
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  onResolve,
  conflictData,
}: ConflictResolutionModalProps) {
  if (!conflictData) return null;

  const totalExisting =
    conflictData.existingAssignments.routines +
    conflictData.existingAssignments.programs +
    conflictData.existingAssignments.videos;

  const totalClipboard =
    conflictData.clipboardAssignments.routines +
    conflictData.clipboardAssignments.programs +
    conflictData.clipboardAssignments.videos;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Conflict Detected
          </DialogTitle>
          <DialogDescription className="text-gray-200">
            The selected date already has {totalExisting} assignment
            {totalExisting !== 1 ? "s" : ""}. You're trying to paste{" "}
            {totalClipboard} assignment{totalClipboard !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing assignments breakdown */}
          <div className="p-3 rounded-lg bg-gray-800/90 border border-gray-600">
            <h4 className="text-sm font-medium text-white mb-2">
              Existing Assignments:
            </h4>
            <div className="space-y-1 text-sm text-gray-100">
              {conflictData.existingAssignments.routines > 0 && (
                <div>
                  • {conflictData.existingAssignments.routines} routine
                  {conflictData.existingAssignments.routines !== 1 ? "s" : ""}
                </div>
              )}
              {conflictData.existingAssignments.programs > 0 && (
                <div>
                  • {conflictData.existingAssignments.programs} program
                  {conflictData.existingAssignments.programs !== 1 ? "s" : ""}
                </div>
              )}
              {conflictData.existingAssignments.videos > 0 && (
                <div>
                  • {conflictData.existingAssignments.videos} video
                  {conflictData.existingAssignments.videos !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>

          {/* Clipboard assignments breakdown */}
          <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-600/50">
            <h4 className="text-sm font-medium text-white mb-2">
              Clipboard Assignments:
            </h4>
            <div className="space-y-1 text-sm text-gray-100">
              {conflictData.clipboardAssignments.routines > 0 && (
                <div>
                  • {conflictData.clipboardAssignments.routines} routine
                  {conflictData.clipboardAssignments.routines !== 1 ? "s" : ""}
                </div>
              )}
              {conflictData.clipboardAssignments.programs > 0 && (
                <div>
                  • {conflictData.clipboardAssignments.programs} program
                  {conflictData.clipboardAssignments.programs !== 1 ? "s" : ""}
                </div>
              )}
              {conflictData.clipboardAssignments.videos > 0 && (
                <div>
                  • {conflictData.clipboardAssignments.videos} video
                  {conflictData.clipboardAssignments.videos !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>

          {/* Resolution options */}
          <div className="space-y-3">
            <Button
              onClick={() => onResolve("replace")}
              className="w-full justify-start bg-red-600/80 hover:bg-red-700/80"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Replace Existing Assignments
              <span className="ml-auto text-xs text-red-200">
                ({totalExisting} removed, {totalClipboard} added)
              </span>
            </Button>

            <Button
              onClick={() => onResolve("merge")}
              className="w-full justify-start bg-blue-600/80 hover:bg-blue-700/80"
            >
              <Merge className="h-4 w-4 mr-2" />
              Merge with Existing
              <span className="ml-auto text-xs text-blue-200">
                ({totalExisting + totalClipboard} total)
              </span>
            </Button>

            <Button
              onClick={() => onResolve("skip")}
              className="w-full justify-start bg-gray-600/80 hover:bg-gray-700/80"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Conflicting Items
              <span className="ml-auto text-xs text-gray-200">
                (Keep existing, skip duplicates)
              </span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
