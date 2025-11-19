"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  Calendar,
  Users,
  UserCheck,
  ArrowLeft,
  FolderOpen,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/app/_trpc/client";
import { Skeleton } from "./ui/skeleton";

interface OrganizationSidebarProps {
  children: React.ReactNode;
}

export default function OrganizationSidebar({
  children,
}: OrganizationSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const { data: organization, isLoading } = trpc.organization.get.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    }
  );

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nls_org_sidebar_open");
      if (saved !== null) {
        setIsOpen(saved === "1");
      }
    } catch {}
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("nls_org_sidebar_open", isOpen ? "1" : "0");
    } catch {}
  }, [isOpen]);

  // Keyboard shortcut: Ctrl/Cmd + B to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navLinks = [
    {
      href: "/organization",
      icon: Home,
      label: "Overview",
      exact: true,
    },
    {
      href: "/organization/calendar",
      icon: Calendar,
      label: "Calendar",
    },
    {
      href: "/organization/library",
      icon: Video,
      label: "Library",
    },
    {
      href: "/organization/resources",
      icon: FolderOpen,
      label: "Resources",
    },
    {
      href: "/organization/clients",
      icon: UserCheck,
      label: "Clients",
    },
    {
      href: "/organization/team",
      icon: Users,
      label: "Team",
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow: hidden !important;
          height: 100vh;
        }
      `}</style>
      <div
        className="flex h-screen overflow-hidden fixed inset-0"
        style={{ backgroundColor: "#2A3133" }}
      >
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r flex flex-col relative z-10 transition-all duration-300 ease-in-out",
            isOpen ? "w-64" : "w-20"
          )}
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-[#4A5A70] to-[#606364] text-white flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
            title={
              isOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"
            }
          >
            {isOpen ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Organization Header */}
          <div
            className={cn(
              "border-b overflow-hidden",
              isOpen ? "p-6" : "px-2 py-5"
            )}
            style={{ borderColor: "#606364" }}
          >
            {isLoading ? (
              <div
                className={cn(
                  "space-y-3",
                  !isOpen && "flex flex-col items-center"
                )}
              >
                <Skeleton
                  className={cn(
                    "rounded-xl",
                    isOpen ? "h-12 w-12" : "h-12 w-12"
                  )}
                  style={{ backgroundColor: "#606364" }}
                />
                {isOpen && (
                  <>
                    <Skeleton
                      className="h-5 w-3/4"
                      style={{ backgroundColor: "#606364" }}
                    />
                    <Skeleton
                      className="h-4 w-1/2"
                      style={{ backgroundColor: "#606364" }}
                    />
                  </>
                )}
              </div>
            ) : organization ? (
              <Link href="/organization" className="block group">
                <div
                  className={cn(
                    "flex items-center",
                    isOpen ? "gap-3 mb-3" : "flex-col gap-0.5 justify-center"
                  )}
                >
                  {/* Logo - can be replaced with uploaded image later */}
                  <div
                    className={cn(
                      "rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out flex-shrink-0 relative overflow-hidden",
                      isOpen ? "w-12 h-12" : "w-12 h-12"
                    )}
                    style={{
                      background:
                        "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                    }}
                  >
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {(organization as any).logoUrl ? (
                      <img
                        src={(organization as any).logoUrl}
                        alt={organization.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building2
                        className={cn(
                          "relative z-10",
                          isOpen ? "h-6 w-6" : "h-7 w-7"
                        )}
                        style={{ color: "#C3BCC2" }}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 min-w-0 transition-all duration-300",
                      isOpen
                        ? "opacity-100 translate-x-0 delay-150"
                        : "opacity-0 -translate-x-4 w-0 h-0"
                    )}
                  >
                    <h2
                      className="font-bold text-lg truncate group-hover:text-white transition-colors duration-200 whitespace-nowrap"
                      style={{ color: "#C3BCC2" }}
                    >
                      {organization.name}
                    </h2>
                  </div>

                  {/* Tier Badge - Collapsed State */}
                  {!isOpen && (
                    <div
                      className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wide bg-gradient-to-r ${
                        organization.tier === "SOLO"
                          ? "from-blue-500 to-cyan-500"
                          : organization.tier === "TEAM"
                          ? "from-green-500 to-emerald-500"
                          : organization.tier === "CLUB"
                          ? "from-purple-500 to-pink-500"
                          : "from-yellow-500 to-orange-500"
                      } text-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg shadow-md`}
                    >
                      {organization.tier}
                    </div>
                  )}
                </div>
                {/* Tier Badge - Expanded State */}
                {isOpen && (
                  <div className="flex items-center gap-2 transition-all duration-300">
                    <span
                      className="text-xs transition-colors duration-200 group-hover:text-white"
                      style={{ color: "#ABA4AA" }}
                    >
                      Team Workspace
                    </span>
                    <div
                      className={`px-2 py-0.5 rounded text-xs font-semibold bg-gradient-to-r ${
                        organization.tier === "SOLO"
                          ? "from-blue-500 to-cyan-500"
                          : organization.tier === "TEAM"
                          ? "from-green-500 to-emerald-500"
                          : organization.tier === "CLUB"
                          ? "from-purple-500 to-pink-500"
                          : "from-yellow-500 to-orange-500"
                      } text-white transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg`}
                    >
                      {organization.tier}
                    </div>
                  </div>
                )}
              </Link>
            ) : (
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    background:
                      "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                  }}
                >
                  <Building2 className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <p className="text-xs" style={{ color: "#ABA4AA" }}>
                  Not in an organization
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = isActive(link.href, link.exact);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center rounded-xl transition-all duration-200 ease-in-out relative overflow-hidden border",
                    isOpen ? "gap-3 px-4 py-3" : "justify-center p-3",
                    active
                      ? "font-semibold shadow-lg"
                      : isOpen
                      ? "hover:bg-white/5 hover:translate-x-1"
                      : "hover:bg-white/10 hover:scale-105"
                  )}
                  style={{
                    backgroundColor: active ? "#4A5A70" : "transparent",
                    color: active ? "#fff" : isOpen ? "#ABA4AA" : "#C3BCC2",
                    borderColor: active ? "#606364" : "transparent",
                    boxShadow: active
                      ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                      : "none",
                  }}
                  title={!isOpen ? link.label : undefined}
                >
                  {/* Hover gradient effect */}
                  {!active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}

                  <Icon
                    className={cn(
                      "transition-all duration-200 flex-shrink-0",
                      isOpen ? "h-5 w-5" : "h-6 w-6",
                      active ? "scale-110" : "group-hover:scale-110"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm relative z-10 whitespace-nowrap transition-all duration-300",
                      isOpen
                        ? "opacity-100 translate-x-0 delay-75"
                        : "opacity-0 -translate-x-4 w-0"
                    )}
                  >
                    {link.label}
                  </span>

                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-white/50" />
                  )}

                  {/* Enhanced tooltip for collapsed state */}
                  {!isOpen && (
                    <div
                      className="absolute left-full ml-4 px-4 py-3 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border"
                      style={{
                        backgroundColor: "#353A3A",
                        color: "#C3BCC2",
                        borderColor: "#606364",
                        transform: "translateY(-50%)",
                        top: "50%",
                        minWidth: "150px",
                      }}
                    >
                      <span className="font-medium">{link.label}</span>
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                        <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="p-4 border-t overflow-hidden"
            style={{ borderColor: "#606364" }}
          >
            <Link href="/dashboard">
              <button
                className={cn(
                  "group w-full flex items-center rounded-xl transition-all duration-200 border relative",
                  isOpen
                    ? "gap-2 justify-center px-4 py-3 hover:bg-white/5 hover:-translate-x-1"
                    : "justify-center p-3 hover:bg-white/10 hover:scale-105"
                )}
                style={{
                  backgroundColor: "transparent",
                  color: isOpen ? "#ABA4AA" : "#C3BCC2",
                  borderColor: "transparent",
                }}
                title={!isOpen ? "Back to Dashboard" : undefined}
              >
                <ArrowLeft
                  className={cn(
                    "transition-transform duration-200 group-hover:-translate-x-1 flex-shrink-0",
                    isOpen ? "h-4 w-4" : "h-6 w-6"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium group-hover:text-white transition-all duration-200 whitespace-nowrap",
                    isOpen
                      ? "opacity-100 translate-x-0 delay-75"
                      : "opacity-0 -translate-x-4 w-0"
                  )}
                >
                  Back to Dashboard
                </span>

                {/* Enhanced tooltip for collapsed state */}
                {!isOpen && (
                  <div
                    className="absolute left-full ml-4 px-4 py-3 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl border"
                    style={{
                      backgroundColor: "#353A3A",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                      transform: "translateY(-50%)",
                      top: "50%",
                    }}
                  >
                    <span className="font-medium">Back to Dashboard</span>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[#353A3A]" />
                    </div>
                  </div>
                )}
              </button>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
          style={{
            backgroundColor: "#2A3133",
          }}
        >
          <div className="animate-in fade-in duration-300 w-full mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
