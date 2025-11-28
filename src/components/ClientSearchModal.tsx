"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { Search, X, User, Mail, Phone } from "lucide-react";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface ClientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
}

export default function ClientSearchModal({
  isOpen,
  onClose,
}: ClientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Get all clients for search
  const { data: clients = [] } = trpc.clients.list.useQuery();

  // Filter clients based on search query
  const query = searchQuery.toLowerCase();
  const filteredClients = (clients || []).filter((client: any) => {
    const name = client.name?.toLowerCase() || "";
    const email = client.email?.toLowerCase() || "";
    const phone = client.phone?.toLowerCase() || "";
    return (
      name.includes(query) || email.includes(query) || phone.includes(query)
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredClients.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredClients.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredClients[selectedIndex]) {
            handleClientSelect(filteredClients[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredClients, selectedIndex, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Inject keyframes animation
  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleId = "client-search-animations";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@keyframes messageSlideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}`;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handleClientSelect = (client: any) => {
    router.push(`/clients/${client.id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(21, 25, 26, 0.75)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl border backdrop-blur-sm"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(229, 178, 50, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            backgroundColor: COLORS.BACKGROUND_CARD,
          }}
        >
          <div className="flex flex-col">
            <span
              className="text-sm font-semibold leading-tight"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Jump to Client
            </span>
            <span
              className="text-[10px] leading-tight"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              Search by name, email, or phone
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{
              color: COLORS.TEXT_SECONDARY,
              backgroundColor: "transparent",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div
          className="px-4 py-3"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search clients by name, email, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
                border: "1px solid",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = getGoldenAccent(0.4);
                e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                  0.1
                )}`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div
          className="max-h-64 overflow-y-auto"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            scrollbarWidth: "thin",
            scrollbarColor: `${COLORS.BORDER_SUBTLE} transparent`,
          }}
        >
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className="p-3 rounded-full mb-3"
                style={{
                  backgroundColor: getGoldenAccent(0.1),
                  border: `1px solid ${getGoldenAccent(0.2)}`,
                }}
              >
                <Search
                  className="h-6 w-6"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {searchQuery ? "No clients found" : "Start typing to search"}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                {searchQuery
                  ? "Try a different search term"
                  : "Search by name, email, or phone"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredClients.map((client: any, index: number) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left animate-[messageSlideIn_0.3s_ease-out] ${
                    index === selectedIndex ? "" : ""
                  }`}
                  style={{
                    backgroundColor:
                      index === selectedIndex
                        ? COLORS.BACKGROUND_CARD
                        : "transparent",
                    animationDelay: `${index * 30}ms`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      index === selectedIndex
                        ? COLORS.BACKGROUND_CARD
                        : "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div className="flex-shrink-0">
                    <ProfilePictureUploader
                      currentAvatarUrl={
                        client.user?.settings?.avatarUrl || client.avatar
                      }
                      userName={client.name}
                      onAvatarChange={() => {}}
                      size="sm"
                      readOnly={true}
                      className="flex-shrink-0"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {client.name}
                      </p>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail
                          className="w-3 h-3"
                          style={{ color: COLORS.TEXT_MUTED }}
                        />
                        <p
                          className="text-xs truncate"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {client.email}
                        </p>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone
                          className="w-3 h-3"
                          style={{ color: COLORS.TEXT_MUTED }}
                        />
                        <p
                          className="text-xs truncate"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {client.phone}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Status removed - property doesn't exist */}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            backgroundColor: COLORS.BACKGROUND_CARD,
          }}
        >
          <div
            className="flex items-center justify-between text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>
              {filteredClients.length} client
              {filteredClients.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
