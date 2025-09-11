"use client";

import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

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

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-black/90 backdrop-blur-xl border-b border-white/10"
          : "bg-black/70 backdrop-blur-lg"
      }`}
    >
      <MaxWidthWrapper>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 opacity-0 group-hover:opacity-20 blur transition duration-300" />
              <div className="relative font-bold text-xl tracking-tight text-white group-hover:text-sky-300 transition-colors duration-300">
                Next Level Softball
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/pricing"
              className="relative px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors duration-200 group"
            >
              <span className="relative z-10">Pricing</span>
              <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>

            <span className="relative px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors duration-200 group cursor-pointer">
              <LoginLink className="relative z-10">Sign In</LoginLink>
              <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </span>

            <RegisterLink>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 group cursor-pointer">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </RegisterLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative p-2 text-white/90 hover:text-white transition-colors duration-200"
          >
            <div className="relative">
              <div className="absolute -inset-2 rounded-lg bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-200" />
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 relative z-10" />
              ) : (
                <Menu className="h-5 w-5 relative z-10" />
              )}
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="py-4 space-y-2">
              <Link
                href="/pricing"
                className="block px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              <LoginLink
                className="block px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </LoginLink>

              <RegisterLink
                className="block px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </RegisterLink>
            </div>
          </div>
        )}
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
