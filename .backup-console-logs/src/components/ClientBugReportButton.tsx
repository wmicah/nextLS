"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileDetection } from "@/lib/mobile-detection";
import { trpc } from "@/app/_trpc/client";
import BugReportModal from "./BugReportModal";

export default function ClientBugReportButton() {
  const { isMobile } = useMobileDetection();
  const pathname = usePathname();
  const [showBugReport, setShowBugReport] = useState(false);

  // Get user role to determine if this is a client page
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  // Check if we're on a client page
  const isClientPage =
    pathname?.startsWith("/client-") ||
    (pathname?.startsWith("/client/") && !pathname?.startsWith("/clients/"));

  // Only show for clients on client pages, and not on mobile
  const shouldShow =
    userProfile?.role === "CLIENT" && isClientPage && !isMobile;

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-lg animate-pulse" />

            <Button
              onClick={() => setShowBugReport(true)}
              size="icon"
              aria-label="Report a bug"
              className="relative h-12 w-12 rounded-full bg-gradient-to-br from-red-600 via-red-600 to-red-700 shadow-lg border-0 transition-all duration-300 hover:scale-110 hover:shadow-red-500/20"
            >
              <AlertCircle className="h-5 w-5 text-white" />
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />
    </>
  );
}
