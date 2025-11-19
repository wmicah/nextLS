"use client";

import VideoReview from "@/components/VideoReview";
import ClientVideoReview from "@/components/ClientVideoReview";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { trpc } from "@/app/_trpc/client";
import { useState, useEffect } from "react";

interface VideoReviewPageProps {
  videoId: string;
}

export default function VideoReviewPage({ videoId }: VideoReviewPageProps) {
  const [videoType, setVideoType] = useState<
    "regular" | "client" | "loading" | "not-found"
  >("loading");

  // Try to get regular video first
  const { data: regularVideo, isLoading: videoLoading } =
    trpc.videos.getById.useQuery(
      {
        id: videoId,
      },
      {
        retry: false,
      }
    );

  // Try to get client submission if regular video not found
  const { data: clientSubmission, isLoading: submissionLoading } =
    trpc.clientRouter.getClientVideoSubmissionById.useQuery(
      {
        id: videoId,
      },
      {
        retry: false,
        enabled: !regularVideo && !videoLoading,
      }
    );

  useEffect(() => {
    if (videoLoading || submissionLoading) {
      setVideoType("loading");
    } else if (regularVideo) {
      setVideoType("regular");
    } else if (clientSubmission) {
      setVideoType("client");
    } else {
      setVideoType("not-found");
    }
  }, [regularVideo, clientSubmission, videoLoading, submissionLoading]);

  if (videoType === "loading") {
    return (
      <Sidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: "#4A5A70" }}
            />
            <p style={{ color: "#C3BCC2" }}>Loading video...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (videoType === "not-found") {
    return (
      <Sidebar>
        <div
          className="min-h-screen p-6"
          style={{ backgroundColor: "#2A3133" }}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                Video Not Found
              </h1>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                The video you're looking for doesn't exist or has been removed.
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

          {/* Not Found Message */}
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#353A3A" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "#ABA4AA" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#C3BCC2" }}>
              Video not found
            </h3>
            <p className="text-sm mb-6" style={{ color: "#ABA4AA" }}>
              Video ID: {videoId}
            </p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Hero Header */}
        <div className="mb-8">
          <div className="rounded-2xl border relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
              }}
            />
            <div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link
                    href="/videos"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Videos</span>
                  </Link>
                  <div>
                    <h1
                      className="text-4xl font-bold mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Video Review
                    </h1>
                    <p className="text-lg" style={{ color: "#ABA4AA" }}>
                      {videoType === "client"
                        ? "Review client video submission"
                        : "Analyze and provide feedback on video content"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Review Component */}
        <div className="max-w-7xl mx-auto">
          {videoType === "client" ? (
            <ClientVideoReview videoId={videoId} />
          ) : (
            <VideoReview videoId={videoId} />
          )}
        </div>
      </div>
    </Sidebar>
  );
}
