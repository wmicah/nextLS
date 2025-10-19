"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, Send, Users, CheckCircle, AlertCircle, Search } from "lucide-react";

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
  });

  // Debug: Log client data
  console.log(
    "📋 Loaded clients:",
    clients.map((c: any) => ({ id: c.id, name: c.name, email: c.email }))
  );

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
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
        style={{ backgroundColor: "#2A3133", borderColor: "#606364" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#606364" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Send className="w-5 h-5" style={{ color: "#C3BCC2" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
                Send Mass Message
              </h2>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Send a message to multiple clients at once
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            style={{ color: "#ABA4AA" }}
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
                style={{ color: "#C3BCC2" }}
              >
                Select Recipients
              </h3>
              <button
                onClick={handleSelectAll}
                disabled={filteredClients.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectAll
                    ? "bg-green-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
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
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                    border: "1px solid",
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: "#353A3A" }}
                  >
                    <Search className="w-6 h-6" style={{ color: "#ABA4AA" }} />
                  </div>
                  <p className="text-sm" style={{ color: "#ABA4AA" }}>
                    {searchTerm
                      ? "No clients found matching your search"
                      : "No clients available"}
                  </p>
                </div>
              ) : (
                filteredClients.map((client: any) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-700/50 transition-colors"
                    style={{
                      backgroundColor: selectedClients.includes(client.id)
                        ? "#4A5A70"
                        : "#353A3A",
                      borderColor: "#606364",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      className="w-4 h-4 rounded border-gray-600"
                      style={{ accentColor: "#4A5A70" }}
                    />
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: "#C3BCC2" }}>
                        {client.name}
                      </div>
                      <div className="text-sm" style={{ color: "#ABA4AA" }}>
                        {client.email}
                      </div>
                    </div>
                    {selectedClients.includes(client.id) && (
                      <CheckCircle
                        className="w-4 h-4"
                        style={{ color: "#10B981" }}
                      />
                    )}
                  </label>
                ))
              )}
            </div>

            {selectedClients.length > 0 && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#C3BCC2" }}
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
              style={{ color: "#C3BCC2" }}
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
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
                border: "1px solid",
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: "#ABA4AA" }}>
                {message.length}/1000 characters
              </span>
              {message.length > 900 && (
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#F59E0B" }}
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
          style={{ borderColor: "#606364" }}
        >
          <div className="text-sm" style={{ color: "#ABA4AA" }}>
            All recipients will receive an email notification
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: "#353A3A",
                color: "#ABA4AA",
                border: "1px solid #606364",
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
                    ? "#4A5A70"
                    : "#606364",
                color: "#C3BCC2",
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
