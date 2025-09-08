"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UrlData {
  id: string;
  title: string;
  url: string;
  filename: string | null;
}

interface CheckResult {
  oldUrls: UrlData[];
  newUrls: UrlData[];
  oldCount: number;
  newCount: number;
}

export default function CheckUrlsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkUrls = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/check-urls");
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || "Failed to check URLs");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUrls();
  }, []);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#2A3133" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-[#353A3A] border-gray-600">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Video URL Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={checkUrls}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Checking..." : "Refresh"}
            </Button>

            {error && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg">
                <p className="font-medium">❌ Error</p>
                <p>{error}</p>
              </div>
            )}

            {data && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="text-red-300 font-medium">
                      Old URLs (secure://master-library/)
                    </h3>
                    <p className="text-2xl font-bold text-red-400">
                      {data.oldCount}
                    </p>
                  </div>
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <h3 className="text-green-300 font-medium">
                      New URLs (/api/master-video/)
                    </h3>
                    <p className="text-2xl font-bold text-green-400">
                      {data.newCount}
                    </p>
                  </div>
                </div>

                {data.oldUrls.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-2">
                      Videos with Old URLs:
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {data.oldUrls.map(item => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-700/50 rounded border border-gray-600"
                        >
                          <p className="text-white font-medium">{item.title}</p>
                          <p className="text-red-400 text-sm font-mono">
                            {item.url}
                          </p>
                          {item.filename && (
                            <p className="text-gray-400 text-xs">
                              File: {item.filename}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.newUrls.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-2">
                      Videos with New URLs:
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {data.newUrls.map(item => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-700/50 rounded border border-gray-600"
                        >
                          <p className="text-white font-medium">{item.title}</p>
                          <p className="text-green-400 text-sm font-mono">
                            {item.url}
                          </p>
                          {item.filename && (
                            <p className="text-gray-400 text-xs">
                              File: {item.filename}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
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
