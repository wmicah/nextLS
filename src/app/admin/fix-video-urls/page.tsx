"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FixVideoUrlsPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleDebugUrls = async () => {
    setIsDebugging(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/debug-urls");
      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "Debug information retrieved",
          data: data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to debug URLs",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const handleUpdateAllUrls = async () => {
    setIsUpdating(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/update-all-video-urls", {
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
          data: data,
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
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#353A3A] border-gray-600">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Fix Video URL Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              This tool will help diagnose and fix video URL issues across all
              database tables.
            </p>

            <div className="flex gap-4">
              <Button
                onClick={handleDebugUrls}
                disabled={isDebugging}
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
              >
                {isDebugging ? "Debugging..." : "Debug URLs"}
              </Button>

              <Button
                onClick={handleUpdateAllUrls}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isUpdating ? "Updating..." : "Fix All URLs"}
              </Button>
            </div>

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

                {result.data && (
                  <div className="mt-4 space-y-2">
                    {result.data.results && (
                      <div className="text-sm">
                        <p>
                          Library Resources:{" "}
                          {result.data.results.libraryResources}
                        </p>
                        <p>
                          Program Drills: {result.data.results.programDrills}
                        </p>
                        <p>
                          Routine Exercises:{" "}
                          {result.data.results.routineExercises}
                        </p>
                        <p className="font-bold">
                          Total Updated: {result.data.totalUpdated}
                        </p>
                      </div>
                    )}

                    {result.data.libraryResources && (
                      <div className="text-sm">
                        <h4 className="font-medium">Library Resources:</h4>
                        <p>Total: {result.data.libraryResources.total}</p>
                        <p>
                          Old URLs:{" "}
                          {result.data.libraryResources.oldUrls.length}
                        </p>
                        <p>
                          New URLs:{" "}
                          {result.data.libraryResources.newUrls.length}
                        </p>
                      </div>
                    )}

                    {result.data.programDrills && (
                      <div className="text-sm">
                        <h4 className="font-medium">Program Drills:</h4>
                        <p>Total: {result.data.programDrills.total}</p>
                        <p>
                          Old URLs: {result.data.programDrills.oldUrls.length}
                        </p>
                        <p>
                          New URLs: {result.data.programDrills.newUrls.length}
                        </p>
                      </div>
                    )}

                    {result.data.routineExercises && (
                      <div className="text-sm">
                        <h4 className="font-medium">Routine Exercises:</h4>
                        <p>Total: {result.data.routineExercises.total}</p>
                        <p>
                          Old URLs:{" "}
                          {result.data.routineExercises.oldUrls.length}
                        </p>
                        <p>
                          New URLs:{" "}
                          {result.data.routineExercises.newUrls.length}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
