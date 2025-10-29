"use client";

import React from "react";
import { Check, Play, MessageSquare, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Drill {
  id: string;
  title: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  tags?: string[];
  description?: string;
  videoUrl?: string;
  isYoutube?: boolean;
  youtubeId?: string;
}

interface SimpleDrillCardProps {
  drill: Drill;
  index: number;
  isCompleted: boolean;
  onMarkComplete: (completed: boolean) => void;
  onOpenVideo: () => void;
  onOpenComment: () => void;
  onOpenVideoSubmission: () => void;
  isLoading?: boolean;
}

export default function SimpleDrillCard({
  drill,
  index,
  isCompleted,
  onMarkComplete,
  onOpenVideo,
  onOpenComment,
  onOpenVideoSubmission,
  isLoading = false,
}: SimpleDrillCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">
              #{index + 1}
            </span>
            <h4 className="text-lg font-semibold text-white">{drill.title}</h4>
          </div>
        </div>

        {/* Completion Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onMarkComplete(!isCompleted);
          }}
          className={cn(
            "h-8 w-8 p-0 rounded-full",
            isCompleted
              ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Exercise Details */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {drill.sets && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">{drill.sets}</div>
              <div className="text-xs text-gray-400">Sets</div>
            </div>
          )}
          {drill.reps && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">{drill.reps}</div>
              <div className="text-xs text-gray-400">Reps</div>
            </div>
          )}
          {drill.tempo && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">{drill.tempo}</div>
              <div className="text-xs text-gray-400">Tempo</div>
            </div>
          )}
        </div>

        {/* Description */}
        {drill.description && (
          <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-300">
              {drill.description.length > 120
                ? `${drill.description.substring(0, 120)}...`
                : drill.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {drill.tags && drill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {drill.tags.map((tag: any, tagIndex: number) => (
              <Badge
                key={tagIndex}
                variant="outline"
                className="text-xs border-blue-500/50 text-blue-400 bg-blue-500/10"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {drill.videoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVideo}
              className="flex-1 border-2 border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 text-xs font-medium"
            >
              <Play className="h-3 w-3 mr-1" />
              Demo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenComment}
            className="flex-1 border-2 border-gray-500 text-gray-400 hover:bg-gray-600/20 hover:border-gray-400 text-xs font-medium"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVideoSubmission}
            className="flex-1 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 text-xs font-medium"
          >
            <Video className="h-3 w-3 mr-1" />
            Record
          </Button>
        </div>
      </div>
    </div>
  );
}
