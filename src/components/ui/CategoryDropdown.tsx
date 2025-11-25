"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Sparkles, Grid3X3 } from "lucide-react";
import { COLORS } from "@/lib/colors";

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
      const dropdownWidth = 320;
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all duration-200 text-xs whitespace-nowrap"
        style={{
          backgroundColor: style.backgroundColor || COLORS.BACKGROUND_DARK,
          borderColor: isOpen ? COLORS.GOLDEN_ACCENT : COLORS.BORDER_SUBTLE,
          color: COLORS.TEXT_PRIMARY,
          minWidth: "120px",
        }}
      >
        <Filter className="h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
        <span className="flex-1 text-left truncate text-xs">
          {displayValue}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: COLORS.TEXT_SECONDARY }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="fixed rounded-lg border shadow-lg overflow-hidden"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
            width: "320px",
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
            className="w-full px-3 py-2 text-left transition-all duration-200 border-b text-xs"
            style={{
              backgroundColor:
                value === "All Categories" ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_DARK,
              borderColor: COLORS.BORDER_SUBTLE,
              color: value === "All Categories" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
            }}
            onMouseEnter={e => {
              if (value !== "All Categories") {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }
            }}
            onMouseLeave={e => {
              if (value !== "All Categories") {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }
            }}
          >
            All Categories
          </button>

          <div className="flex">
            {/* Left Side - Group Selector */}
            <div
              className="w-28 border-r"
              style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_DARK }}
            >
              {/* Standard Group */}
              <button
                type="button"
                onMouseEnter={() => setHoveredGroup("standard")}
                onClick={() => setHoveredGroup("standard")}
                className="w-full px-3 py-2 text-left transition-all duration-200 flex items-center gap-1.5 border-b text-xs"
                style={{
                  backgroundColor:
                    hoveredGroup === "standard" ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: hoveredGroup === "standard" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
              >
                <span className="text-xs font-medium">Standard</span>
              </button>

              {/* Custom Group */}
              {customCategories.length > 0 && (
                <button
                  type="button"
                  onMouseEnter={() => setHoveredGroup("custom")}
                  onClick={() => setHoveredGroup("custom")}
                  className="w-full px-3 py-2 text-left transition-all duration-200 flex items-center gap-1.5 text-xs"
                  style={{
                    backgroundColor:
                      hoveredGroup === "custom" ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_DARK,
                    color: hoveredGroup === "custom" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                  }}
                >
                  <span className="text-xs font-medium">Custom</span>
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
                      className="w-full px-3 py-2 text-left transition-all duration-200 hover:pl-4 text-xs"
                      style={{
                        backgroundColor:
                          value === cat ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_DARK,
                        color: value === cat ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={e => {
                        if (value !== cat) {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }
                      }}
                      onMouseLeave={e => {
                        if (value !== cat) {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
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
                      className="w-full px-3 py-2 text-left transition-all duration-200 hover:pl-4 flex items-center justify-between text-xs"
                      style={{
                        backgroundColor:
                          value === cat.name ? COLORS.GOLDEN_DARK : COLORS.BACKGROUND_DARK,
                        color: value === cat.name ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={e => {
                        if (value !== cat.name) {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }
                      }}
                      onMouseLeave={e => {
                        if (value !== cat.name) {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }
                      }}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                        ({cat.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!hoveredGroup && (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
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
