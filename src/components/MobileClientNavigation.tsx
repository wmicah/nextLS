"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Calendar,
  MessageCircle,
  Settings,
  Bell,
  User,
} from "lucide-react";

interface MobileClientNavigationProps {
  currentPage?: string;
}

export default function MobileClientNavigation({
  currentPage,
}: MobileClientNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Panel */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backgroundColor: "#2A3133" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#606364]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Client Menu</h2>
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
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`p-4 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-[#4A5A70] text-white shadow-lg"
                    : "bg-[#353A3A] text-[#C3BCC2] hover:bg-[#4A5A70] hover:text-white"
                }`}
                style={{ minHeight: "80px" }}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive(item.href)
                        ? "bg-white/20"
                        : "bg-[#4A5A70]"
                    }`}
                  >
                    {item.icon}
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

        {/* Footer */}
        <div className="p-4 border-t border-[#606364] bg-[#353A3A]">
          <div className="text-center">
            <p className="text-xs text-[#ABA4AA]">
              Tap outside to close menu
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
