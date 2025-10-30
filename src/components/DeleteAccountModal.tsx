"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { useRouter } from "next/navigation";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { LogOut, AlertTriangle, X } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
    onSuccess: async data => {
      console.log("✅ Account deletion successful:", data);

      // Give a brief moment for the deletion to fully complete on the server
      await new Promise(resolve => setTimeout(resolve, 500));

      // Build an absolute URL that Kinde accepts, then redirect to Kinde logout
      const postLogout = `${window.location.origin}/?accountDeleted=true`;
      window.location.href = `/api/auth/logout?post_logout_redirect_url=${encodeURIComponent(
        postLogout
      )}`;
    },
    onError: (error: any) => {
      console.error("❌ Error deleting account:", error);
      setIsDeleting(false);
      // Display error message to user
      const message =
        error?.data?.message ||
        error?.message ||
        "Failed to delete account. Please try again or contact support.";
      setErrorMessage(message);

      // Log detailed error for debugging
      console.error("Deletion error details:", {
        code: error?.data?.code,
        message: error?.data?.message || error?.message,
        stack: error?.stack,
      });
    },
  });

  const handleDelete = async () => {
    if (confirmationText !== "DELETE MY ACCOUNT") {
      return;
    }

    // Clear any previous error messages
    setErrorMessage(null);
    setIsDeleting(true);
    deleteAccountMutation.mutate({
      confirmationText,
      reason: reason || undefined,
    });
  };

  const handleClose = () => {
    setErrorMessage(null);
    setConfirmationText("");
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl border max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#1E1E1E",
          borderColor: "#2a2a2a",
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "#ffffff" }}
              >
                Delete Account
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-xl border"
              style={{
                backgroundColor: "#2A1F1F",
                borderColor: "#DC2626",
              }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1" style={{ color: "#FCA5A5" }}>
                    Deletion Failed
                  </h3>
                  <p className="text-sm" style={{ color: "#FCA5A5" }}>
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div
            className="mb-6 p-4 rounded-xl border"
            style={{
              backgroundColor: "#2A1F1F",
              borderColor: "#DC2626",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1" style={{ color: "#FCA5A5" }}>
                  This action cannot be undone
                </h3>
                <p className="text-sm" style={{ color: "#FCA5A5" }}>
                  Deleting your account will permanently remove all your data,
                  including:
                </p>
                <ul
                  className="text-sm mt-2 space-y-1"
                  style={{ color: "#FCA5A5" }}
                >
                  <li>• Your profile and settings</li>
                  <li>• All programs and workouts you created</li>
                  <li>• Client relationships and messages</li>
                  <li>• Progress tracking data</li>
                  <li>• Video uploads and feedback</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reason (optional) */}
          <div className="mb-6">
            <label
              htmlFor="reason"
              className="block text-sm font-medium mb-2"
              style={{ color: "#9ca3af" }}
            >
              Why are you deleting your account? (Optional)
            </label>
            <select
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                backgroundColor: "#2a2a2a",
                borderColor: "#374151",
                color: "#ffffff",
              }}
            >
              <option value="">Select a reason (optional)</option>
              <option value="wrong_role">I selected the wrong role</option>
              <option value="no_longer_needed">
                I no longer need this account
              </option>
              <option value="found_better_solution">
                I found a better solution
              </option>
              <option value="too_expensive">Too expensive</option>
              <option value="privacy_concerns">Privacy concerns</option>
              <option value="technical_issues">Technical issues</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Confirmation */}
          <div className="mb-6">
            <label
              htmlFor="confirmation"
              className="block text-sm font-medium mb-2"
              style={{ color: "#9ca3af" }}
            >
              To confirm, type{" "}
              <span
                className="font-mono px-1 rounded"
                style={{
                  backgroundColor: "#374151",
                  color: "#ffffff",
                }}
              >
                DELETE MY ACCOUNT
              </span>
            </label>
            <input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={e => setConfirmationText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                backgroundColor: "#2a2a2a",
                borderColor: "#374151",
                color: "#ffffff",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border rounded-md transition-colors disabled:opacity-50"
              style={{
                borderColor: "#374151",
                color: "#9ca3af",
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "#374151";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={e => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmationText !== "DELETE MY ACCOUNT" || isDeleting}
              className="flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#DC2626",
                color: "#ffffff",
              }}
              onMouseEnter={e => {
                if (!isDeleting && confirmationText === "DELETE MY ACCOUNT") {
                  e.currentTarget.style.backgroundColor = "#B91C1C";
                }
              }}
              onMouseLeave={e => {
                if (!isDeleting && confirmationText === "DELETE MY ACCOUNT") {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }
              }}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
