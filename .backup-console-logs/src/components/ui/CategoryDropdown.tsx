"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Sparkles, Grid3X3 } from "lucide-react";

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  standardCategories: string[];
  customCategories: Array<{ name: string; count: number }>;
  className?: string;
  style?: React.CSSProperties;
}

export default function CategoryDropdown({
  value,
  onChange,
  standardCategories,
  customCategories,
  className = "",
  style = {},
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<
    "standard" | "custom" | null
  >(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number | "auto";
    right: number | "auto";
  }>({ top: 0, left: 0, right: "auto" });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownWidth = 340;
      const spaceOnRight = window.innerWidth - rect.right;

      // Position dropdown to the right if there's space, otherwise to the left
      if (spaceOnRight >= dropdownWidth) {
        setPosition({
          top: rect.bottom + 8,
          left: rect.left,
          right: "auto",
        });
      } else {
        setPosition({
          top: rect.bottom + 8,
          left: "auto",
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isOpen]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
        setHoveredGroup(null);
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHoveredGroup(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setHoveredGroup(null);
  };

  const displayValue = value === "All Categories" ? "All Categories" : value;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 text-sm whitespace-nowrap"
        style={{
          backgroundColor: style.backgroundColor || "#606364",
          borderColor: isOpen ? "#C3BCC2" : "#ABA4AA",
          color: "#C3BCC2",
          minWidth: "140px",
        }}
      >
        <Filter className="h-4 w-4" style={{ color: "#ABA4AA" }} />
        <span className="flex-1 text-left truncate text-sm">
          {displayValue}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "#ABA4AA" }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="fixed rounded-xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
            width: "340px",
            zIndex: 9999,
            top: `${position.top}px`,
            left: position.left !== "auto" ? `${position.left}px` : undefined,
            right:
              position.right !== "auto" ? `${position.right}px` : undefined,
          }}
        >
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => handleSelect("All Categories")}
            className="w-full px-4 py-3 text-left transition-all duration-200 border-b"
            style={{
              backgroundColor:
                value === "All Categories" ? "#4A5A70" : "transparent",
              borderColor: "#606364",
              color: value === "All Categories" ? "#FFFFFF" : "#C3BCC2",
            }}
            onMouseEnter={e => {
              if (value !== "All Categories") {
                e.currentTarget.style.backgroundColor = "#2A3133";
              }
            }}
            onMouseLeave={e => {
              if (value !== "All Categories") {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            All Categories
          </button>

          <div className="flex">
            {/* Left Side - Group Selector */}
            <div
              className="w-32 border-r"
              style={{ borderColor: "#606364", backgroundColor: "#2A3133" }}
            >
              {/* Standard Group */}
              <button
                type="button"
                onMouseEnter={() => setHoveredGroup("standard")}
                onClick={() => setHoveredGroup("standard")}
                className="w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-2 border-b"
                style={{
                  backgroundColor:
                    hoveredGroup === "standard" ? "#4A5A70" : "transparent",
                  borderColor: "#606364",
                  color: hoveredGroup === "standard" ? "#FFFFFF" : "#C3BCC2",
                }}
              >
                <span className="text-sm font-medium">Standard</span>
              </button>

              {/* Custom Group */}
              {customCategories.length > 0 && (
                <button
                  type="button"
                  onMouseEnter={() => setHoveredGroup("custom")}
                  onClick={() => setHoveredGroup("custom")}
                  className="w-full px-4 py-3 text-left transition-all duration-200 flex items-center gap-2"
                  style={{
                    backgroundColor:
                      hoveredGroup === "custom" ? "#4A5A70" : "transparent",
                    color: hoveredGroup === "custom" ? "#FFFFFF" : "#C3BCC2",
                  }}
                >
                  <span className="text-sm font-medium">Custom</span>
                </button>
              )}
            </div>

            {/* Right Side - Category Options */}
            <div className="flex-1 max-h-64 overflow-y-auto">
              {hoveredGroup === "standard" && (
                <div>
                  {standardCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelect(cat)}
                      className="w-full px-4 py-3 text-left transition-all duration-200 hover:pl-6"
                      style={{
                        backgroundColor:
                          value === cat ? "#4A5A70" : "transparent",
                        color: value === cat ? "#FFFFFF" : "#C3BCC2",
                      }}
                      onMouseEnter={e => {
                        if (value !== cat) {
                          e.currentTarget.style.backgroundColor = "#2A3133";
                        }
                      }}
                      onMouseLeave={e => {
                        if (value !== cat) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {hoveredGroup === "custom" && (
                <div>
                  {customCategories.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleSelect(cat.name)}
                      className="w-full px-4 py-3 text-left transition-all duration-200 hover:pl-6 flex items-center justify-between"
                      style={{
                        backgroundColor:
                          value === cat.name ? "#4A5A70" : "transparent",
                        color: value === cat.name ? "#FFFFFF" : "#C3BCC2",
                      }}
                      onMouseEnter={e => {
                        if (value !== cat.name) {
                          e.currentTarget.style.backgroundColor = "#2A3133";
                        }
                      }}
                      onMouseLeave={e => {
                        if (value !== cat.name) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs" style={{ color: "#ABA4AA" }}>
                        ({cat.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!hoveredGroup && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: "#ABA4AA" }}>
                    Hover over a group to see categories
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
