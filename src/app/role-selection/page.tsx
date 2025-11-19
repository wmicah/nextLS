"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Users,
  User,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Key,
  CheckCircle,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Shield,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import CoachPricingModal from "@/components/CoachPricingModal";

type Step = 1 | 2 | 3;
type Role = "COACH" | "CLIENT" | null;

export default function RoleSelectionPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const [useInviteCode, setUseInviteCode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [error, setError] = useState("");
  const [emailValidationStatus, setEmailValidationStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [inviteCodeValidationStatus, setInviteCodeValidationStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const router = useRouter();

  // Email validation query with debouncing
  const { data: emailValidation, isLoading: isValidatingEmail } =
    trpc.user.checkCoachExists.useQuery(
      { email: coachEmail },
      {
        enabled: coachEmail.length > 0 && coachEmail.includes("@"),
        staleTime: 1000 * 60, // Cache for 1 minute
      }
    );

  // Invite code validation query with debouncing
  const { data: inviteCodeValidation, isLoading: isValidatingInviteCode } =
    trpc.user.validateInviteCode.useQuery(
      { inviteCode },
      {
        enabled: inviteCode.length > 0,
        staleTime: 1000 * 60, // Cache for 1 minute
      }
    );

  // Update email validation status based on query result
  useEffect(() => {
    if (coachEmail.length === 0) {
      setEmailValidationStatus("idle");
    } else if (isValidatingEmail) {
      setEmailValidationStatus("checking");
    } else if (emailValidation) {
      setEmailValidationStatus(emailValidation.exists ? "valid" : "invalid");
    }
  }, [coachEmail, isValidatingEmail, emailValidation]);

  // Update invite code validation status based on query result
  useEffect(() => {
    if (inviteCode.length === 0) {
      setInviteCodeValidationStatus("idle");
    } else if (isValidatingInviteCode) {
      setInviteCodeValidationStatus("checking");
    } else if (inviteCodeValidation) {
      setInviteCodeValidationStatus(
        inviteCodeValidation.valid ? "valid" : "invalid"
      );
    }
  }, [inviteCode, isValidatingInviteCode, inviteCodeValidation]);

  const updateRole = (trpc.user.updateRole as any).useMutation({
    onSuccess: (data: any) => {
      const role = data?.role;
      if (role === "COACH") {
        router.push("/dashboard");
      } else if (role === "CLIENT") {
        // Check if client joined via invite code or email request
        if (inviteCode) {
          // Invite code = direct access to client dashboard
          router.push("/client-dashboard");
        } else if (coachEmail) {
          // Email request = waiting for approval
          router.push("/client-waiting");
        } else {
          // No coach connection = waiting page
          router.push("/client-waiting");
        }
      }
    },
    onError: (error: any) => {
      console.error("Error updating role:", error);
      setError(error.message || "Failed to set up your account");
      setIsLoading(false);
    },
  });

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError("");

    // If coach, skip to confirmation
    if (role === "COACH") {
      setCurrentStep(3);
    } else {
      // If client, go to coach selection
      setCurrentStep(2);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // Validate input
      if (useInviteCode) {
        if (!inviteCode.trim()) {
          setError("Please enter an invite code");
          return;
        }
      } else {
        if (!coachEmail.trim()) {
          setError("Please enter your coach's email");
          return;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(coachEmail)) {
          setError("Please enter a valid email address");
          return;
        }
      }
      setError("");
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep === 3 && selectedRole === "COACH") {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;

    if (selectedRole === "COACH") {
      // Show pricing modal for coaches
      setShowPricingModal(true);
    } else {
      // For clients, validate that they have a coach connection
      const hasInviteCode = useInviteCode && inviteCode.trim();
      const hasCoachEmail = !useInviteCode && coachEmail.trim();

      if (!hasInviteCode && !hasCoachEmail) {
        setError(
          "Please provide either an invite code or your coach's email address"
        );
        setCurrentStep(2); // Go back to coach selection step
        return;
      }

      // For clients, proceed directly
      setIsLoading(true);
      setError("");

      try {
        updateRole.mutate({
          role: selectedRole,
          inviteCode: useInviteCode ? inviteCode : undefined,
          coachEmail: !useInviteCode ? coachEmail : undefined,
        });
      } catch (err) {
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    }
  };

  const handleSelectPlan = (tier: string, clientLimit: number) => {
    setShowPricingModal(false);
    setIsLoading(true);
    setError("");

    try {
      updateRole.mutate({
        role: "COACH",
        coachId: undefined,
        // TODO: Add subscription tier and client limit to the mutation
      });
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      step === currentStep
                        ? "text-white scale-110 shadow-lg"
                        : step < currentStep
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                    style={{
                      backgroundColor:
                        step === currentStep
                          ? "#4A5A70"
                          : step < currentStep
                          ? "#22c55e"
                          : "#606364",
                    }}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className="w-12 sm:w-20 h-1 mx-2 rounded transition-all duration-300"
                      style={{
                        backgroundColor:
                          step < currentStep ? "#22c55e" : "#606364",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Step {currentStep} of 3 •{" "}
                {currentStep === 1
                  ? "Choose Role"
                  : currentStep === 2
                  ? "Connect with Coach"
                  : "Confirm"}
              </p>
            </div>
          </div>

          {/* Main Content Card */}
          <div
            className="rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              backgroundColor: "#353A3A",
              borderColor: "#606364",
            }}
          >
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome to Next Level Coaching!
                  </h2>
                  <p style={{ color: "#ABA4AA" }}>
                    Let's get started by choosing your role
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Coach Option */}
                  <div
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 group ${
                      selectedRole === "COACH" ? "shadow-lg" : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor:
                        selectedRole === "COACH" ? "#2B3038" : "#2A3133",
                      borderColor:
                        selectedRole === "COACH" ? "#4A5A70" : "#606364",
                    }}
                    onClick={() => handleRoleSelect("COACH")}
                  >
                    <div className="flex items-start">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor:
                            selectedRole === "COACH" ? "#4A5A70" : "#606364",
                        }}
                      >
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">
                          I'm a Coach
                        </h3>
                        <p
                          className="text-sm mb-3"
                          style={{ color: "#ABA4AA" }}
                        >
                          Manage athletes, create programs, and track progress
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              backgroundColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            <Target className="h-3 w-3" /> Program Builder
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              backgroundColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            <TrendingUp className="h-3 w-3" /> Analytics
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              backgroundColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            <Calendar className="h-3 w-3" /> Scheduling
                          </span>
                        </div>
                      </div>
                      {selectedRole === "COACH" && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle
                            className="h-6 w-6"
                            style={{ color: "#4A5A70" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Option */}
                  <div
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 group ${
                      selectedRole === "CLIENT"
                        ? "shadow-lg"
                        : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor:
                        selectedRole === "CLIENT" ? "#2B3038" : "#2A3133",
                      borderColor:
                        selectedRole === "CLIENT" ? "#4A5A70" : "#606364",
                    }}
                    onClick={() => handleRoleSelect("CLIENT")}
                  >
                    <div className="flex items-start">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor:
                            selectedRole === "CLIENT" ? "#4A5A70" : "#606364",
                        }}
                      >
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">
                          I'm an Athlete
                        </h3>
                        <p
                          className="text-sm mb-3"
                          style={{ color: "#ABA4AA" }}
                        >
                          Follow training programs and track my progress
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              backgroundColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            <Target className="h-3 w-3" /> Training Calendar
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              backgroundColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            <TrendingUp className="h-3 w-3" /> Progress Tracking
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{
                              backgroundColor: "#606364",
                              color: "#FFFFFF",
                            }}
                          >
                            <Calendar className="h-3 w-3" /> Lesson Booking
                          </span>
                        </div>
                      </div>
                      {selectedRole === "CLIENT" && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle
                            className="h-6 w-6"
                            style={{ color: "#4A5A70" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Coach Connection (only for clients) */}
            {currentStep === 2 && selectedRole === "CLIENT" && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Connect with Your Coach
                  </h2>
                  <p style={{ color: "#ABA4AA" }}>
                    Use an invite code or request access via email
                  </p>
                </div>

                {/* Toggle between invite code and email */}
                <div
                  className="flex gap-2 mb-6 p-1 rounded-lg"
                  style={{ backgroundColor: "#2A3133" }}
                >
                  <button
                    onClick={() => {
                      setUseInviteCode(true);
                      setError("");
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      useInviteCode
                        ? "text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      backgroundColor: useInviteCode
                        ? "#4A5A70"
                        : "transparent",
                    }}
                  >
                    <Key className="h-4 w-4 inline mr-2" />
                    Invite Code
                  </button>
                  <button
                    onClick={() => {
                      setUseInviteCode(false);
                      setError("");
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      !useInviteCode
                        ? "text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      backgroundColor: !useInviteCode
                        ? "#4A5A70"
                        : "transparent",
                    }}
                  >
                    <Mail className="h-4 w-4 inline mr-2" />
                    Coach Email
                  </button>
                </div>

                {useInviteCode ? (
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Enter your coach's invite code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={e => {
                          setInviteCode(e.target.value.toUpperCase());
                          setError("");
                        }}
                        placeholder="e.g., NLS-A1B2C3-D4E5"
                        className="w-full px-4 py-3 pr-12 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 text-center text-lg font-mono tracking-wider"
                        style={{
                          backgroundColor: "#2A3133",
                          borderColor:
                            inviteCodeValidationStatus === "valid"
                              ? "#10B981"
                              : inviteCodeValidationStatus === "invalid"
                              ? "#EF4444"
                              : inviteCodeValidationStatus === "checking"
                              ? "#F59E0B"
                              : "#606364",
                        }}
                        maxLength={20}
                      />
                      {/* Validation Status Icon */}
                      {inviteCodeValidationStatus === "checking" && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-yellow-500" />
                      )}
                      {inviteCodeValidationStatus === "valid" && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                      {inviteCodeValidationStatus === "invalid" && (
                        <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                      )}
                    </div>

                    {/* Invite Code Validation Feedback */}
                    {inviteCodeValidationStatus === "valid" &&
                      inviteCodeValidation?.coach && (
                        <div className="mt-2 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-400">
                              Coach found:{" "}
                              <strong>
                                {inviteCodeValidation.coach.name ||
                                  inviteCodeValidation.coach.email}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                    {inviteCodeValidationStatus === "invalid" && (
                      <div className="mt-2 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-400">
                            Invalid invite code. Please check with your coach
                            and try again.
                          </span>
                        </div>
                      </div>
                    )}
                    <div
                      className="mt-4 p-4 rounded-lg"
                      style={{
                        backgroundColor: "#2B3038",
                        borderColor: "#4A5A70",
                      }}
                    >
                      <p className="text-sm" style={{ color: "#C3BCC2" }}>
                        <strong>ℹ️ Where to find this:</strong> Your coach can
                        find their unique invite code on their dashboard or
                        clients page. Ask them to share it with you!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Enter your coach's email address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                        style={{ color: "#ABA4AA" }}
                      />
                      <input
                        type="email"
                        value={coachEmail}
                        onChange={e => {
                          setCoachEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="coach@example.com"
                        className="w-full pl-10 pr-12 py-3 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: "#2A3133",
                          borderColor:
                            emailValidationStatus === "valid"
                              ? "#10B981"
                              : emailValidationStatus === "invalid"
                              ? "#EF4444"
                              : emailValidationStatus === "checking"
                              ? "#F59E0B"
                              : "#606364",
                        }}
                      />
                      {/* Validation Status Icon */}
                      {emailValidationStatus === "checking" && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-yellow-500" />
                      )}
                      {emailValidationStatus === "valid" && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                      {emailValidationStatus === "invalid" && (
                        <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                      )}
                    </div>

                    {/* Email Validation Feedback */}
                    {emailValidationStatus === "valid" &&
                      emailValidation?.coach && (
                        <div className="mt-2 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-400">
                              Coach found:{" "}
                              <strong>
                                {emailValidation.coach.name ||
                                  emailValidation.coach.email}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                    {emailValidationStatus === "invalid" && (
                      <div className="mt-2 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-400">
                            No coach found with this email address
                          </span>
                        </div>
                      </div>
                    )}
                    <div
                      className="mt-4 p-4 rounded-lg"
                      style={{
                        backgroundColor: "#2B3038",
                        borderColor: "#4A5A70",
                      }}
                    >
                      <p className="text-sm" style={{ color: "#C3BCC2" }}>
                        <strong>⏳ Request Pending:</strong> If your coach
                        exists in our system, they'll receive a notification to
                        approve your request. If they don't exist, you'll see an
                        error message.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    className="mt-4 p-3 rounded-lg flex items-center gap-2"
                    style={{
                      backgroundColor: "#2B3038",
                      borderColor: "#ef4444",
                    }}
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Almost There!
                  </h2>
                  <p style={{ color: "#ABA4AA" }}>
                    Review your information before we set up your account
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: "#2A3133" }}
                  >
                    <p className="text-sm mb-1" style={{ color: "#ABA4AA" }}>
                      Your Role
                    </p>
                    <p className="text-lg font-semibold text-white flex items-center gap-2">
                      {selectedRole === "COACH" ? (
                        <>
                          <Users
                            className="h-5 w-5"
                            style={{ color: "#4A5A70" }}
                          />
                          Coach
                        </>
                      ) : (
                        <>
                          <User
                            className="h-5 w-5"
                            style={{ color: "#4A5A70" }}
                          />
                          Athlete
                        </>
                      )}
                    </p>
                  </div>

                  {selectedRole === "CLIENT" && (
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: "#2A3133" }}
                    >
                      <p className="text-sm mb-1" style={{ color: "#ABA4AA" }}>
                        Coach Connection Method
                      </p>
                      {useInviteCode ? (
                        <div>
                          <p className="text-lg font-semibold text-white flex items-center gap-2">
                            <Key
                              className="h-5 w-5"
                              style={{ color: "#4A5A70" }}
                            />
                            Invite Code: {inviteCode}
                          </p>
                          <p
                            className="text-xs mt-2"
                            style={{ color: "#ABA4AA" }}
                          >
                            You'll be connected directly to your coach
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-semibold text-white flex items-center gap-2">
                            <Mail
                              className="h-5 w-5"
                              style={{ color: "#4A5A70" }}
                            />
                            Email Request: {coachEmail}
                          </p>
                          <p
                            className="text-xs mt-2"
                            style={{ color: "#ABA4AA" }}
                          >
                            Your coach will receive a notification to approve
                            your request
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedRole === "CLIENT" && (
                  <div
                    className="p-4 rounded-lg mb-6"
                    style={{
                      backgroundColor: "#2B3038",
                      borderColor: "#4A5A70",
                    }}
                  >
                    <p className="text-sm" style={{ color: "#C3BCC2" }}>
                      <strong>📝 Next Steps:</strong>{" "}
                      {useInviteCode
                        ? "Your coach will be notified of your registration and can begin assigning you programs immediately."
                        : "You'll be redirected to a waiting page. Your coach will need to approve your request before you can access the full platform."}
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg flex items-center gap-2"
                    style={{
                      backgroundColor: "#2B3038",
                      borderColor: "#ef4444",
                    }}
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div
              className="px-8 py-6 flex items-center justify-between border-t"
              style={{
                backgroundColor: "#2A3133",
                borderColor: "#606364",
              }}
            >
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentStep === 1 || isLoading
                    ? "cursor-not-allowed"
                    : "hover:bg-gray-700"
                }`}
                style={{
                  color: currentStep === 1 || isLoading ? "#606364" : "#ABA4AA",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!selectedRole || isLoading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRole && !isLoading
                      ? "text-white shadow-lg"
                      : "cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor:
                      selectedRole && !isLoading ? "#4A5A70" : "#606364",
                    color: selectedRole && !isLoading ? "#ffffff" : "#ABA4AA",
                  }}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={!selectedRole || isLoading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRole && !isLoading
                      ? "text-white shadow-lg"
                      : "cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor:
                      selectedRole && !isLoading ? "#4A5A70" : "#606364",
                    color: selectedRole && !isLoading ? "#ffffff" : "#ABA4AA",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Confirm & Continue
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Delete Account Option */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 text-sm transition-colors"
              style={{ color: "#ABA4AA" }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "#C3BCC2";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "#ABA4AA";
              }}
            >
              <AlertCircle className="h-4 w-4" />
              Need to start over? Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Coach Pricing Modal */}
      <CoachPricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
