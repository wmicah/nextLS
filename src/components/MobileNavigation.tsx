"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  LogOut,
  Check,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { COLORS } from "@/lib/colors";

interface MobileNavigationProps {
  currentPage?: string;
}

export default function MobileNavigation({
  currentPage,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const router = useRouter();
  const logoutButtonRef = useRef<HTMLButtonElement>(null);

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();
  const { data: userSettings } = trpc.settings.getSettings.useQuery();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle clicks outside logout button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        logoutButtonRef.current &&
        !logoutButtonRef.current.contains(event.target as Node) &&
        showLogout
      ) {
        setShowLogout(false);
      }
    };

    if (showLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogout]);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      isActive: currentPage === "dashboard",
    },
    {
      name: "Clients",
      href: "/clients",
      isActive: currentPage === "clients",
    },
    {
      name: "Programs",
      href: "/programs",
      isActive: currentPage === "programs",
    },
    {
      name: "Library",
      href: "/library",
      isActive: currentPage === "library",
    },
    {
      name: "Schedule",
      href: "/schedule",
      isActive: currentPage === "schedule",
    },
    {
      name: "Settings",
      href: "/settings",
      isActive: currentPage === "settings",
    },
  ];

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg border transition-all duration-200"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
          color: COLORS.TEXT_PRIMARY,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        }}
        aria-label="Open navigation menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 right-0 border-b shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ 
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <h2 className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: COLORS.TEXT_MUTED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_MUTED;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map(item => {
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200"
                  style={{
                    backgroundColor: item.isActive ? COLORS.GOLDEN_ACCENT : "rgba(255, 255, 255, 0.02)",
                    borderColor: item.isActive ? COLORS.GOLDEN_ACCENT : COLORS.BORDER_SUBTLE,
                    color: item.isActive ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }
                  }}
                >
                  <span className="text-sm font-medium text-center">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Profile Footer */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div 
            className="rounded-lg p-3 border"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="rounded-full p-0.5 border"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <ProfilePictureUploader
                  currentAvatarUrl={userSettings?.avatarUrl || null}
                  userName={currentUser?.name || currentUser?.email || "User"}
                  onAvatarChange={() => {}}
                  size="sm"
                  readOnly={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {currentUser?.name || currentUser?.email || "User"}
                </p>
                <p className="text-xs truncate" style={{ color: COLORS.TEXT_MUTED }}>Coach</p>
              </div>

              <button
                ref={logoutButtonRef}
                onClick={() => {
                  if (showLogout) {
                    handleLogout();
                  } else {
                    setShowLogout(true);
                  }
                }}
                className="rounded-lg p-2 transition-all duration-300 border"
                style={{
                  backgroundColor: showLogout ? COLORS.GREEN_DARK : "rgba(255, 255, 255, 0.02)",
                  borderColor: showLogout ? COLORS.GREEN_DARK : COLORS.BORDER_SUBTLE,
                  color: "#FFFFFF",
                }}
                onMouseEnter={(e) => {
                  if (showLogout) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                  } else {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (showLogout) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                  } else {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }
                }}
              >
                <div className="relative w-4 h-4">
                  <LogOut
                    className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
                      showLogout
                        ? "opacity-0 rotate-180 scale-0"
                        : "opacity-100 rotate-0 scale-100"
                    }`}
                  />
                  <Check
                    className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
                      showLogout
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 rotate-180 scale-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
