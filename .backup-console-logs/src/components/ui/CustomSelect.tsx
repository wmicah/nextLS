"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  searchable?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  style = {},
  disabled = false,
  searchable = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const searchLower = searchTerm.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(searchLower)
    );
  }, [options, searchTerm, searchable]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 sm:p-2 rounded-lg border text-white text-base sm:text-sm min-h-[48px] flex items-center justify-between transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${className}`}
        style={style}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: "#1F2323", border: "1px solid #4A4F4F" }}
        >
          {/* Search input */}
          {searchable && (
            <div
              className="sticky top-0 p-2 border-b"
              style={{ borderColor: "#4A4F4F", backgroundColor: "#1F2323" }}
            >
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded text-sm border"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full px-3 py-2 text-left text-white transition-colors ${
                    option.value === value ? "" : "hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor:
                      option.value === value ? "#2A2F2F" : "transparent",
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div
                className="px-3 py-2 text-center text-sm"
                style={{ color: "#ABA4AA" }}
              >
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
