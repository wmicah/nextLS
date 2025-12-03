"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoUpload from "./VideoUpload";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { COLORS, getGoldenAccent } from "@/lib/colors";

export default function VideoUploadPage() {
  const [uploadComplete, setUploadComplete] = useState(false);
  const router = useRouter();

  const handleUploadComplete = (videoId: string) => {
    console.log("Video uploaded successfully:", videoId);
    setUploadComplete(true);
    // Redirect to videos page after successful upload
    setTimeout(() => {
      router.push("/videos");
    }, 2000);
  };

  return (
    <Sidebar>
      <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/videos"
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 border"
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
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Upload Video
              </h1>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Upload bullpen footage, practice videos, or game footage for
                review
              </p>
            </div>
          </div>

          {/* Upload Success Message */}
          {uploadComplete && (
            <div 
              className="mb-6 p-4 rounded-xl border-2"
              style={{ 
                borderColor: COLORS.GREEN_PRIMARY,
                backgroundColor: COLORS.GREEN_PRIMARY + "10",
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.GREEN_PRIMARY }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 
                    className="font-semibold"
                    style={{ color: COLORS.GREEN_PRIMARY }}
                  >
                    Video uploaded successfully!
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Redirecting to videos page...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Component */}
          <Card 
            className="border"
            style={{ 
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                <Video className="h-5 w-5" />
                Video Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUpload onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
}
