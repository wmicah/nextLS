"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdateUrlsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    updatedCount?: number;
  } | null>(null);

  const handleUpdateUrls = async () => {
    setIsUpdating(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/update-video-urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          updatedCount: data.updatedCount,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to update URLs",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#2A3133" }}>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-[#353A3A] border-gray-600">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Update Video URLs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              This will update all video URLs from the old{" "}
              <code className="bg-gray-700 px-2 py-1 rounded text-red-400">
                secure://master-library/
              </code>{" "}
              format to the new{" "}
              <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
                /api/master-video/
              </code>{" "}
              format.
            </p>

            <Button
              onClick={handleUpdateUrls}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? "Updating..." : "Update Video URLs"}
            </Button>

            {result && (
              <div
                className={`p-4 rounded-lg ${
                  result.success
                    ? "bg-green-900/30 border border-green-500/50 text-green-300"
                    : "bg-red-900/30 border border-red-500/50 text-red-300"
                }`}
              >
                <p className="font-medium">
                  {result.success ? "✅ Success!" : "❌ Error"}
                </p>
                <p>{result.message}</p>
                {result.updatedCount !== undefined && (
                  <p className="text-sm mt-1">
                    Updated {result.updatedCount} video URLs
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

