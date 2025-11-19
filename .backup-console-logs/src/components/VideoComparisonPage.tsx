"use client";

import { useState } from "react";
import VideoComparison from "@/components/VideoComparison";
import { ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";
import Sidebar from "./Sidebar";

export default function VideoComparisonPage() {
  const [video1Id, setVideo1Id] = useState("");
  const [video2Id, setVideo2Id] = useState("");
  const { data: videos = [] } = trpc.videos.list.useQuery();

  return (
    <Sidebar>
      <div className="min-h-screen p-6" style={{ backgroundColor: "#2A3133" }}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "#C3BCC2" }}
            >
              Video Comparison
            </h1>
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              Compare videos side by side
            </p>
          </div>
          <Link
            href="/videos"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
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
              style={{ color: "#C3BCC2" }}
            >
              Primary Video
            </label>
            <select
              value={video1Id}
              onChange={e => setVideo1Id(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
                border: "1px solid",
              }}
            >
              <option value="">Select a video...</option>
              {videos.map(video => (
                <option key={video.id} value={video.id}>
                  {video.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label
              className="block text-sm font-medium"
              style={{ color: "#C3BCC2" }}
            >
              Comparison Video (Optional)
            </label>
            <select
              value={video2Id}
              onChange={e => setVideo2Id(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
                border: "1px solid",
              }}
            >
              <option value="">Select a video...</option>
              {videos.map(video => (
                <option key={video.id} value={video.id}>
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
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#353A3A" }}
            >
              <Video className="w-8 h-8" style={{ color: "#ABA4AA" }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#C3BCC2" }}>
              Select a video to start comparing
            </h3>
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              Choose at least one video to begin the comparison
            </p>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
