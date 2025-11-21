"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Calendar,
  MessageCircle,
  Settings,
  Bell,
  User,
  LogOut,
  Check,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import ProfilePictureUploader from "./ProfilePictureUploader";

interface MobileClientNavigationProps {
  currentPage?: string;
}

export default function MobileClientNavigation({
  currentPage,
}: MobileClientNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
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

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/client-dashboard",
      icon: <Home className="h-5 w-5" />,
      description: "Program & progress",
    },
    {
      name: "Schedule",
      href: "/client-schedule",
      icon: <Calendar className="h-5 w-5" />,
      description: "Training calendar",
    },
    {
      name: "Messages",
      href: "/client-messages",
      icon: <MessageCircle className="h-5 w-5" />,
      description: "Coach communication",
    },
    {
      name: "Settings",
      href: "/client-settings",
      icon: <Settings className="h-5 w-5" />,
      description: "Account settings",
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
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-[#4A5A70] transition-colors"
        style={{ minWidth: "44px", minHeight: "44px" }}
      >
        <Menu className="h-6 w-6" style={{ color: "#C3BCC2" }} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ 
          backgroundColor: "#2A3133",
          paddingTop: "env(safe-area-inset-top)"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#606364]">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Athlete Menu</h2>
              <p className="text-xs text-gray-400">Navigation & settings</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-[#4A5A70] transition-colors"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <X className="h-6 w-6" style={{ color: "#C3BCC2" }} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map(item => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-[#4A5A70] text-white shadow-lg"
                    : "bg-[#353A3A] text-[#C3BCC2] hover:bg-[#4A5A70] hover:text-white"
                }`}
                style={{ minHeight: "70px" }}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 rounded-lg">
                    <div className="w-6 h-2">{item.icon}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#606364]">
          <div className="bg-[#2A2F2F] border border-[#606364] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="border border-white/20 rounded-full p-0.5">
                <ProfilePictureUploader
                  currentAvatarUrl={userSettings?.avatarUrl || null}
                  userName={currentUser?.name || currentUser?.email || "User"}
                  onAvatarChange={() => {}}
                  size="sm"
                  readOnly={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.name || currentUser?.email || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">Athlete</p>
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
                className={`rounded-full p-2 transition-all duration-300 ${
                  showLogout
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#4A5A70] hover:bg-[#606364] text-white"
                }`}
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
