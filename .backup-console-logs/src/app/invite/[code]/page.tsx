"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs";
import { CheckCircle, XCircle, Key, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.code as string;
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [coachName, setCoachName] = useState<string | null>(null);

  // Validate invite code
  const { data: validation, isLoading } = trpc.user.validateInviteCode.useQuery(
    { inviteCode },
    {
      enabled: !!inviteCode,
      retry: false,
    }
  );

  useEffect(() => {
    if (!isLoading && validation) {
      setIsValidating(false);
      setIsValid(validation.valid);

      if (validation.valid && validation.coach) {
        setCoachName(validation.coach.name || validation.coach.email);
        // Store invite code in localStorage when validation succeeds
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingInviteCode", inviteCode);
        }
      }
    }
  }, [isLoading, validation, inviteCode]);

  if (isValidating || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A1F24] to-[#2A3133]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A5A70] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#C3BCC2] mb-2">
            Validating invite code...
          </h2>
          <p className="text-[#ABA4AA]">Please wait</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A1F24] to-[#2A3133]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-[#C3BCC2] mb-2">
            Invalid Invite Code
          </h2>
          <p className="text-[#ABA4AA] mb-6">
            The invite code you're trying to use is invalid or has expired.
            Please check with your coach and try again.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A5A70] text-[#C3BCC2] hover:bg-[#606364] transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A1F24] to-[#2A3133]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-[#C3BCC2] mb-2">
          Invite Code Valid!
        </h2>
        <p className="text-[#ABA4AA] mb-4">
          You've been invited to join {coachName}'s coaching program.
        </p>
        <div className="flex items-center justify-center gap-2 text-[#4A5A70] mb-6">
          <Key className="h-4 w-4" />
          <span className="text-sm font-mono">{inviteCode}</span>
        </div>
        <RegisterLink className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A5A70] text-[#C3BCC2] hover:bg-[#606364] transition-colors font-medium">
          Continue to Sign Up
          <ArrowRight className="h-4 w-4" />
        </RegisterLink>
      </div>
    </div>
  );
}
