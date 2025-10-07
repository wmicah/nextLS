"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Target,
  BookOpen,
  Calendar,
  Settings,
  X,
} from "lucide-react";

interface MobileNavigationProps {
  currentPage?: string;
}

export default function MobileNavigation({
  currentPage,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

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

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: currentPage === "dashboard",
    },
    {
      name: "Clients",
      href: "/clients",
      icon: Users,
      isActive: currentPage === "clients",
    },
    {
      name: "Programs",
      href: "/programs",
      icon: Target,
      isActive: currentPage === "programs",
    },
    {
      name: "Library",
      href: "/library",
      icon: BookOpen,
      isActive: currentPage === "library",
    },
    {
      name: "Schedule",
      href: "/schedule",
      icon: Calendar,
      isActive: currentPage === "schedule",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: currentPage === "settings",
    },
  ];

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-[#4A5A70] text-white transition-all duration-200 hover:bg-[#606364] active:scale-95"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 right-0 bg-[#353A3A] border-b border-[#606364] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#606364]">
          <h2 className="text-lg font-bold text-white">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#4A5A70] transition-all duration-200 active:scale-95"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    item.isActive
                      ? "bg-[#4A5A70] text-white shadow-lg"
                      : "bg-[#2A2F2F] text-gray-300 hover:bg-[#3A4040] hover:text-white"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium text-center">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#606364]">
          <div className="bg-[#2A2F2F] border border-[#606364] rounded-lg p-3">
            <p className="text-xs text-gray-400 text-center">
              Next Level Softball
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Coach Dashboard
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
