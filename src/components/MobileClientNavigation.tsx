"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Calendar,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Check,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface MobileClientNavigationProps {
  currentPage?: string;
}

export default function MobileClientNavigation({
  currentPage,
}: MobileClientNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const pathname = usePathname();
  const logoutButtonRef = useRef<HTMLButtonElement>(null);

  // Get current user info
  const { data: currentUser } = trpc.user.getProfile.useQuery();
  const { data: userSettings } = trpc.settings.getSettings.useQuery();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

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

  const { data: unreadNotifications = 0 } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      staleTime: 30 * 1000,
    });
  const { data: unreadMessages = 0 } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    { staleTime: 30 * 1000 }
  );

  const navigationItems = [
    {
      name: "My Program",
      href: "/client-dashboard",
      icon: <Home className="h-5 w-5" />,
      description: "Program & progress",
    },
    {
      name: "Schedule",
      href: "/client-schedule",
      icon: <Calendar className="h-5 w-5" />,
      description: "Lessons & calendar",
    },
    {
      name: "Messages",
      href: "/client-messages",
      icon: <MessageCircle className="h-5 w-5" />,
      description: "Chat with coach",
      badge: unreadMessages,
    },
    {
      name: "Alerts",
      href: "/client-notifications",
      icon: <Bell className="h-5 w-5" />,
      description: "Notifications",
      badge: unreadNotifications,
    },
    {
      name: "Settings",
      href: "/client-settings",
      icon: <Settings className="h-5 w-5" />,
      description: "Account & preferences",
    },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg transition-colors touch-manipulation"
        style={{
          minWidth: 44,
          minHeight: 44,
          color: COLORS.TEXT_PRIMARY,
          backgroundColor: "transparent",
        }}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 right-0 z-[101] transform transition-transform duration-300 ease-in-out max-h-[100dvh] flex flex-col overflow-hidden`}
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          paddingTop: "env(safe-area-inset-top)",
          transform: isOpen ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="min-w-0">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Menu
            </h2>
            <p
              className="text-sm truncate"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              Navigation & settings
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg transition-colors touch-manipulation flex-shrink-0"
            style={{
              minWidth: 44,
              minHeight: 44,
              color: COLORS.TEXT_PRIMARY,
            }}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Items - scrollable */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map(item => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="p-4 rounded-xl transition-all duration-200 touch-manipulation flex flex-col items-center text-center min-h-[88px] justify-center relative"
                style={{
                  backgroundColor: isActive(item.href)
                    ? getGoldenAccent(0.15)
                    : COLORS.BACKGROUND_CARD,
                  color: isActive(item.href)
                    ? COLORS.GOLDEN_ACCENT
                    : COLORS.TEXT_PRIMARY,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: isActive(item.href)
                    ? getGoldenAccent(0.35)
                    : COLORS.BORDER_SUBTLE,
                }}
              >
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    className="absolute top-2 right-2 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: COLORS.RED_ALERT,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="p-2 flex items-center justify-center"
                    style={{
                      color: isActive(item.href)
                        ? COLORS.GOLDEN_ACCENT
                        : COLORS.TEXT_SECONDARY,
                    }}
                  >
                    {"icon" in item && item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{item.name}</div>
                    <div
                      className="text-sm mt-0.5"
                      style={{
                        color: isActive(item.href)
                          ? COLORS.TEXT_SECONDARY
                          : COLORS.TEXT_MUTED,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div
          className="p-4 border-t flex-shrink-0"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="rounded-full flex-shrink-0 border-2 p-0.5"
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
                <p
                  className="text-base font-medium truncate"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {currentUser?.name || currentUser?.email || "User"}
                </p>
                <p
                  className="text-sm truncate"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Athlete
                </p>
              </div>

              <button
                ref={logoutButtonRef}
                type="button"
                onClick={() => {
                  if (showLogout) {
                    handleLogout();
                  } else {
                    setShowLogout(true);
                  }
                }}
                className="rounded-full p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-300 touch-manipulation"
                style={{
                  backgroundColor: showLogout
                    ? COLORS.GREEN_PRIMARY
                    : getGoldenAccent(0.2),
                  color: showLogout
                    ? COLORS.BACKGROUND_DARK
                    : COLORS.GOLDEN_ACCENT,
                }}
              >
                <div className="relative w-5 h-5">
                  <LogOut
                    className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${showLogout ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"}`}
                  />
                  <Check
                    className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${showLogout ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-180 scale-0"}`}
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
