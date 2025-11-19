"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoUpload from "./VideoUpload";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/videos"
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Videos</span>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
            <p className="text-gray-400">
              Upload bullpen footage, practice videos, or game footage for
              review
            </p>
          </div>
        </div>

        {/* Upload Success Message */}
        {uploadComplete && (
          <div className="mb-6 p-4 rounded-xl border-2 border-green-500 bg-green-500/10">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
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
                <h3 className="text-green-400 font-semibold">
                  Video uploaded successfully!
                </h3>
                <p className="text-gray-400 text-sm">
                  Redirecting to videos page...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Component */}
        <Card className="bg-[#2A3133] border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
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
  );
}
