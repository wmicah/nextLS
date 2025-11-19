"use client";

import { useState, useEffect } from "react";
import { X, Mail, Key, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SwitchCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SwitchCoachModal({
  isOpen,
  onClose,
  onSuccess,
}: SwitchCoachModalProps) {
  const [method, setMethod] = useState<"code" | "email">("code");
  const [inviteCode, setInviteCode] = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [codeValidationStatus, setCodeValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [emailValidationStatus, setEmailValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  // Validate invite code
  const { data: codeValidation, isLoading: isValidatingCodeQuery } =
    trpc.user.validateInviteCode.useQuery(
      { inviteCode },
      {
        enabled: inviteCode.length > 0 && method === "code",
        staleTime: 1000 * 60,
      }
    );

  // Check if coach exists by email
  const { data: emailValidation, isLoading: isValidatingEmailQuery } =
    trpc.user.checkCoachExists.useQuery(
      { email: coachEmail },
      {
        enabled:
          coachEmail.length > 0 &&
          coachEmail.includes("@") &&
          method === "email",
        staleTime: 1000 * 60,
      }
    );

  // Update validation statuses
  useEffect(() => {
    if (method === "code") {
      if (inviteCode.length === 0) {
        setCodeValidationStatus("idle");
      } else if (isValidatingCodeQuery) {
        setIsValidatingCode(true);
      } else if (codeValidation) {
        setIsValidatingCode(false);
        setCodeValidationStatus(codeValidation.valid ? "valid" : "invalid");
      }
    }
  }, [inviteCode, isValidatingCodeQuery, codeValidation, method]);

  useEffect(() => {
    if (method === "email") {
      if (coachEmail.length === 0) {
        setEmailValidationStatus("idle");
      } else if (isValidatingEmailQuery) {
        setIsValidatingEmail(true);
      } else if (emailValidation) {
        setIsValidatingEmail(false);
        setEmailValidationStatus(emailValidation.exists ? "valid" : "invalid");
      }
    }
  }, [coachEmail, isValidatingEmailQuery, emailValidation, method]);

  // Request new coach mutation
  const requestNewCoach = trpc.user.requestNewCoach.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      // Reset form
      setInviteCode("");
      setCoachEmail("");
      setCodeValidationStatus("idle");
      setEmailValidationStatus("idle");
    },
    onError: error => {
      console.error("Error requesting new coach:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "code" && inviteCode && codeValidationStatus === "valid") {
      requestNewCoach.mutate({ inviteCode });
    } else if (
      method === "email" &&
      coachEmail &&
      emailValidationStatus === "valid"
    ) {
      requestNewCoach.mutate({ coachEmail });
    }
  };

  const isFormValid =
    (method === "code" && codeValidationStatus === "valid") ||
    (method === "email" && emailValidationStatus === "valid");

  const isSubmitting = requestNewCoach.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 bg-transparent">
        <div
          className="rounded-2xl shadow-2xl border overflow-hidden"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-5 border-b flex items-center justify-between"
            style={{ borderColor: "#606364" }}
          >
            <div>
              <DialogTitle
                className="text-2xl font-bold m-0"
                style={{ color: "#C3BCC2" }}
              >
                Switch Coach
              </DialogTitle>
              <DialogDescription
                className="text-sm mt-1 m-0"
                style={{ color: "#ABA4AA" }}
              >
                Request to join a new coach
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg transition-colors hover:bg-[#4A5A70] disabled:opacity-50"
              style={{ color: "#ABA4AA" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* Method Selection */}
            <div className="mb-6">
              <label
                className="text-sm font-medium mb-3 block"
                style={{ color: "#C3BCC2" }}
              >
                How would you like to join?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("code");
                    setCoachEmail("");
                    setEmailValidationStatus("idle");
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    method === "code"
                      ? "border-[#4A5A70] bg-[#4A5A70]/20"
                      : "border-[#606364] bg-transparent hover:border-[#4A5A70]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Key
                      className={`h-6 w-6 ${
                        method === "code" ? "text-[#C3BCC2]" : "text-[#ABA4AA]"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        method === "code" ? "text-[#C3BCC2]" : "text-[#ABA4AA]"
                      }`}
                    >
                      Invite Code
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setInviteCode("");
                    setCodeValidationStatus("idle");
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    method === "email"
                      ? "border-[#4A5A70] bg-[#4A5A70]/20"
                      : "border-[#606364] bg-transparent hover:border-[#4A5A70]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Mail
                      className={`h-6 w-6 ${
                        method === "email" ? "text-[#C3BCC2]" : "text-[#ABA4AA]"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        method === "email" ? "text-[#C3BCC2]" : "text-[#ABA4AA]"
                      }`}
                    >
                      Coach Email
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Input Field */}
            <div className="mb-6">
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "#C3BCC2" }}
              >
                {method === "code" ? "Enter Invite Code" : "Enter Coach Email"}
              </label>
              <div className="relative">
                {method === "code" ? (
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                    disabled={isSubmitting}
                    maxLength={20}
                  />
                ) : (
                  <input
                    type="email"
                    value={coachEmail}
                    onChange={e => setCoachEmail(e.target.value.toLowerCase())}
                    placeholder="coach@example.com"
                    className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                    disabled={isSubmitting}
                  />
                )}

                {/* Validation Icon */}
                {method === "code" && inviteCode.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isValidatingCode ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#4A5A70]" />
                    ) : codeValidationStatus === "valid" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : codeValidationStatus === "invalid" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                )}

                {method === "email" && coachEmail.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isValidatingEmail ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#4A5A70]" />
                    ) : emailValidationStatus === "valid" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : emailValidationStatus === "invalid" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Validation Messages */}
              {method === "code" && codeValidationStatus === "invalid" && (
                <p className="text-sm text-red-400 mt-2">
                  Invalid invite code. Please check and try again.
                </p>
              )}
              {method === "email" && emailValidationStatus === "invalid" && (
                <p className="text-sm text-red-400 mt-2">
                  No coach found with this email. Please verify and try again.
                </p>
              )}
              {method === "code" && codeValidationStatus === "valid" && (
                <p className="text-sm text-green-400 mt-2">
                  Valid invite code! Ready to request.
                </p>
              )}
              {method === "email" && emailValidationStatus === "valid" && (
                <p className="text-sm text-green-400 mt-2">
                  Coach found! Ready to request.
                </p>
              )}
            </div>

            {/* Error Message */}
            {requestNewCoach.error && (
              <div
                className="mb-4 p-3 rounded-lg border"
                style={{
                  backgroundColor: "#4A1F1F",
                  borderColor: "#7F1D1D",
                }}
              >
                <p className="text-sm text-red-400">
                  {requestNewCoach.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg border transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#606364",
                  color: "#ABA4AA",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isFormValid ? "#4A5A70" : "#606364",
                  color: "#C3BCC2",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>

            {/* Info Text */}
            <p
              className="text-xs text-center mt-4"
              style={{ color: "#ABA4AA" }}
            >
              Your coach will receive a notification and can approve your
              request.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
