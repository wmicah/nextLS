"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, Send, Users, CheckCircle, AlertCircle, Search } from "lucide-react";
import { COLORS, getGoldenAccent, getBluePrimary } from "@/lib/colors";

interface MassMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MassMessageModal({
  isOpen,
  onClose,
}: MassMessageModalProps) {
  const [message, setMessage] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get coach's clients
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
    scope: "organization",
  });

  // Debug: Log client data

  // Mass message mutation
  const sendMassMessageMutation = trpc.messaging.sendMassMessage.useMutation({
    onSuccess: data => {
      setIsSending(false);

      // Show success/error summary
      if (data.totalFailed > 0) {
        alert(
          `Mass message sent to ${data.totalSent} clients, but failed for ${data.totalFailed} clients. Check your notifications for details.`
        );
      } else {
        alert(`Mass message sent successfully to ${data.totalSent} clients!`);
      }

      // Clear form and close modal
      setMessage("");
      setSelectedClients([]);
      setSelectAll(false);
      onClose();
    },
    onError: error => {
      setIsSending(false);
      console.error("Failed to send mass message:", error);
      alert(`Failed to send mass message: ${error.message}`);
    },
  });

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((client: any) => client.id));
    }
    setSelectAll(!selectAll);
  };

  const handleClientToggle = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || selectedClients.length === 0) return;

    console.log("📤 Sending mass message to clients:", selectedClients);
    console.log("📤 Message content:", message.trim());

    setIsSending(true);
    try {
      await sendMassMessageMutation.mutateAsync({
        clientIds: selectedClients,
        content: message.trim(),
      });
    } catch (error) {
      console.error("❌ Error sending mass message:", error);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients.filter((client: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.coach?.name?.toLowerCase().includes(searchLower) ||
      client.primaryCoach?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${getGoldenAccent(
            0.1
          )}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Send Mass Message
            </h2>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Send a message to multiple clients at once
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Client Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Select Recipients
              </h3>
              <button
                onClick={handleSelectAll}
                disabled={filteredClients.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: selectAll
                    ? COLORS.GOLDEN_ACCENT
                    : COLORS.BACKGROUND_CARD,
                  color: selectAll ? "#ffffff" : COLORS.TEXT_PRIMARY,
                  border: `1px solid ${
                    selectAll ? COLORS.GOLDEN_BORDER : COLORS.BORDER_SUBTLE
                  }`,
                }}
                onMouseEnter={e => {
                  if (!selectAll && !e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }
                }}
                onMouseLeave={e => {
                  if (!selectAll && !e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }
                }}
              >
                <Users className="w-4 h-4" />
                {selectAll
                  ? "Deselect All"
                  : `Select All (${filteredClients.length})`}
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                    border: "1px solid",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_DARK;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                      0.2
                    )}`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{
                      backgroundColor: getGoldenAccent(0.1),
                      color: COLORS.GOLDEN_ACCENT,
                    }}
                  >
                    <Search
                      className="w-6 h-6"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                    />
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {searchTerm
                      ? "No clients found matching your search"
                      : "No clients available"}
                  </p>
                </div>
              ) : (
                filteredClients.map((client: any) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selectedClients.includes(client.id)
                        ? getBluePrimary(0.1)
                        : COLORS.BACKGROUND_CARD,
                      borderColor: selectedClients.includes(client.id)
                        ? COLORS.BLUE_PRIMARY
                        : COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={e => {
                      if (!selectedClients.includes(client.id)) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!selectedClients.includes(client.id)) {
                        e.currentTarget.style.backgroundColor =
                          COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.borderColor =
                          COLORS.BORDER_SUBTLE;
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: COLORS.BLUE_PRIMARY }}
                    />
                    <div className="flex-1">
                      <div
                        className="font-medium"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {client.name}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {client.email}
                      </div>
                      {(client.primaryCoach?.name || client.coach?.name) && (
                        <div
                          className="text-xs mt-1"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Assigned Coach:{" "}
                          {client.primaryCoach?.name || client.coach?.name}
                        </div>
                      )}
                    </div>
                    {selectedClients.includes(client.id) && (
                      <CheckCircle
                        className="w-4 h-4"
                        style={{ color: COLORS.BLUE_PRIMARY }}
                      />
                    )}
                  </label>
                ))
              )}
            </div>

            {selectedClients.length > 0 && (
              <div
                className="mt-3 p-3 rounded-lg border"
                style={{
                  backgroundColor: getBluePrimary(0.1),
                  borderColor: COLORS.BLUE_PRIMARY,
                }}
              >
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: COLORS.BLUE_PRIMARY }}
                >
                  <Users className="w-4 h-4" />
                  <span>
                    {selectedClients.length} client
                    {selectedClients.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 resize-none"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
                border: "1px solid",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${getGoldenAccent(
                  0.2
                )}`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                {message.length}/1000 characters
              </span>
              {message.length > 900 && (
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Approaching limit</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-6 border-t"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            All recipients will receive an email notification
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_SECONDARY,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor =
                  COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={
                !message.trim() || selectedClients.length === 0 || isSending
              }
              className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor:
                  selectedClients.length > 0 && message.trim()
                    ? COLORS.BLUE_PRIMARY
                    : COLORS.TEXT_MUTED,
                color: "#ffffff",
              }}
              onMouseEnter={e => {
                if (
                  selectedClients.length > 0 &&
                  message.trim() &&
                  !isSending
                ) {
                  e.currentTarget.style.backgroundColor = COLORS.BLUE_DARK;
                }
              }}
              onMouseLeave={e => {
                if (
                  selectedClients.length > 0 &&
                  message.trim() &&
                  !isSending
                ) {
                  e.currentTarget.style.backgroundColor = COLORS.BLUE_PRIMARY;
                }
              }}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {selectedClients.length} client
                  {selectedClients.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
