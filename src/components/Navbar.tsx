"use client";

import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          ? "bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-black/10 backdrop-blur-lg"
      }`}
    >
      <MaxWidthWrapper>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="font-bold text-xl tracking-tight text-white group-hover:text-sky-400 transition-colors duration-300">
              NextLevel Coaching
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/features"
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              Features
            </Link>

            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              Pricing
            </Link>

            <LoginLink
              authUrlParams={{ prompt: "login" }}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              Sign In
            </LoginLink>

            <RegisterLink>
              <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-all duration-200">
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
              <div className="border-t border-white/10 bg-black/30 backdrop-blur-xl">
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
                    <LoginLink
                      className="flex items-center px-4 py-3 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </LoginLink>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="pt-2"
                  >
                    <RegisterLink
                      className="flex items-center justify-center px-4 py-3 text-base font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-all duration-200 mx-4"
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
