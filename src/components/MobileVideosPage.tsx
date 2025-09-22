"use client";

import { Monitor, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

export default function MobileVideosPage() {
  const router = useRouter();

  return (
    <Sidebar>
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#2A3133" }}
      >
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Monitor className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-4">
            Desktop Only Feature
          </h1>

          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            The Videos page is optimized for desktop use and provides the best
            experience on larger screens. Please access this feature from your
            computer for full functionality including video management, client
            submissions review, and detailed video analysis.
          </p>

          {/* Features list */}
          <div className="text-left mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">
              Desktop features include:
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Video submission management</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Client video review and feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Video comparison tools</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Advanced filtering and search</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <span>Detailed video analytics</span>
              </li>
            </ul>
          </div>

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 mx-auto"
            style={{ backgroundColor: "#4A5A70", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </Sidebar>
  );
}



