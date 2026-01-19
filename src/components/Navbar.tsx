"use client";

import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import {
  LoginLink,
  RegisterLink,
  useKindeAuth,
} from "@kinde-oss/kinde-auth-nextjs";
import { ArrowRight, Menu, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useKindeAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = event.target as Element;
        if (!target.closest("nav")) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#2A3133]/95 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-[#2A3133]/80 backdrop-blur-lg"
      }`}
    >
      <MaxWidthWrapper>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="font-bold text-xl tracking-tight text-white group-hover:text-zinc-300 transition-colors duration-300">
              NextLevel Coaching
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Features Dropdown */}
            <div className="relative group">
            <Link
              href="/features"
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              Features
            </Link>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[600px] bg-[#353A3A] border border-white/10 rounded-xl shadow-2xl p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-sm text-zinc-300 mb-4 leading-relaxed font-medium">
                  Everything you need to run a professional coaching business
                </p>
                <div className="space-y-3">
                  {[
                    {
                      name: "Program Builder",
                      description:
                        "Create comprehensive training programs with drag-and-drop simplicity. Build weeks, days, and drills with video demonstrations.",
                    },
                    {
                      name: "Video Analysis",
                      description:
                        "Professional video coaching with built-in annotation tools, voice feedback, and frame-by-frame analysis.",
                    },
                    {
                      name: "Unified Messaging",
                      description:
                        "All communication in one place with real-time messaging, file sharing, and push notifications.",
                    },
                    {
                      name: "Smart Scheduling",
                      description:
                        "Automated scheduling system that eliminates back-and-forth coordination. Clients can book and swap times themselves.",
                    },
                    {
                      name: "Analytics Dashboard",
                      description:
                        "Track client progress, completion rates, and engagement. Show data that justifies renewals and drives growth.",
                    },
                    {
                      name: "Client Management",
                      description:
                        "Manage your coaching roster with comprehensive client profiles, progress tracking, and milestone achievements.",
                    },
                  ].map((feature) => (
                    <div key={feature.name} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                        <h4 className="text-sm font-semibold text-white">
                          {feature.name}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 ml-6 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <p className="text-xs text-zinc-400 italic">
                      + and more
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              Pricing
            </Link>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
              >
                Dashboard
              </Link>
            ) : (
              <LoginLink className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5">
                Sign In
              </LoginLink>
            )}

            <RegisterLink>
              <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-[#1a1f20] bg-[#E5B232] rounded-lg hover:bg-[#F5C242] transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#E5B232]/20">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </span>
            </RegisterLink>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="border-t border-white/10 bg-[#2A3133]/95 backdrop-blur-xl">
                <div className="py-6 space-y-1">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      href="/features"
                      className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Features
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link
                      href="/pricing"
                      className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isAuthenticated ? (
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <LoginLink
                        className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign In
                      </LoginLink>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="pt-2"
                  >
                    <RegisterLink
                      className="flex items-center justify-center px-4 py-3 text-base font-semibold text-[#1a1f20] bg-[#E5B232] rounded-lg hover:bg-[#F5C242] transition-all duration-200 mx-4 shadow-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </RegisterLink>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
