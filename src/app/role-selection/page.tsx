"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Users, User } from "lucide-react";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<"COACH" | "CLIENT" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateRole = trpc.user?.updateRole?.useMutation({
    onSuccess: data => {
      // ✅ Now check the actual returned role
      if (data.role === "COACH") {
        router.push("/dashboard");
      } else if (data.role === "CLIENT") {
        router.push("/client-waiting");
      }
    },
    onError: (error: unknown) => {
      console.error("Error updating role:", error);
      setIsLoading(false);
    },
  });

  const handleRoleSelect = async () => {
    if (!selectedRole) return;

    // If client is selected, redirect to waiting page instead of requiring coach selection
    if (selectedRole === "CLIENT") {
      setIsLoading(true);
      updateRole.mutate({
        role: selectedRole,
        coachId: undefined, // No coach selection needed
      });
    } else {
      setIsLoading(true);
      updateRole.mutate({
        role: selectedRole,
        coachId: undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose your role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            How will you be using Next Level Softball?
          </p>
        </div>

        <div className="space-y-4">
          {/* Coach Option */}
          <div
            className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
              selectedRole === "COACH"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setSelectedRole("COACH")}
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  I&apos;m a Coach
                </h3>
                <p className="text-sm text-gray-500">
                  Manage athletes, create programs, and track progress
                </p>
              </div>
              {selectedRole === "COACH" && (
                <div className="absolute top-4 right-4">
                  <div className="h-4 w-4 rounded-full bg-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Client Option */}
          <div
            className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
              selectedRole === "CLIENT"
                ? "border-green-600 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setSelectedRole("CLIENT")}
          >
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  I&apos;m an Athlete
                </h3>
                <p className="text-sm text-gray-500">
                  Follow training programs and track my progress
                </p>
              </div>
              {selectedRole === "CLIENT" && (
                <div className="absolute top-4 right-4">
                  <div className="h-4 w-4 rounded-full bg-green-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole || isLoading}
            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
              selectedRole && !isLoading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Setting up account..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
