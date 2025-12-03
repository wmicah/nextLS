"use client";

import { useState } from "react";
import VideoComparison from "@/components/VideoComparison";
import { ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";
import Sidebar from "./Sidebar";
import { COLORS, getGoldenAccent } from "@/lib/colors";

export default function VideoComparisonPage() {
  const [video1Id, setVideo1Id] = useState("");
  const [video2Id, setVideo2Id] = useState("");
  const { data: videos = [] } = trpc.videos.list.useQuery();

  return (
    <Sidebar>
      <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Video Comparison
            </h1>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Compare videos side by side
            </p>
          </div>
          <Link
            href="/videos"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm border"
            style={{ 
              backgroundColor: COLORS.BACKGROUND_CARD,
              color: COLORS.TEXT_PRIMARY,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.borderColor = getGoldenAccent(0.3);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Videos</span>
          </Link>
        </div>

        {/* Video Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <label
              className="block text-sm font-medium"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Primary Video
            </label>
            <select
              value={video1Id}
              onChange={e => setVideo1Id(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(0.1)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Select a video...</option>
              {videos.map(video => (
                <option key={video.id} value={video.id} style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
                  {video.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label
              className="block text-sm font-medium"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Comparison Video (Optional)
            </label>
            <select
              value={video2Id}
              onChange={e => setVideo2Id(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(0.1)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>Select a video...</option>
              {videos.map(video => (
                <option key={video.id} value={video.id} style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
                  {video.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Video Comparison Component */}
        {video1Id ? (
          <VideoComparison
            video1Id={video1Id}
            video2Id={video2Id || undefined}
          />
        ) : (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border"
              style={{ 
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <Video className="w-8 h-8" style={{ color: COLORS.TEXT_SECONDARY }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Select a video to start comparing
            </h3>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Choose at least one video to begin the comparison
            </p>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
