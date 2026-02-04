"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { X, User, Mail, Phone, CheckCircle, Circle } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes:
    | string
    | null
    | Array<{
        id: string;
        content: string;
        title: string | null;
        type: string;
        priority: string;
        isPrivate: boolean;
        createdAt: string;
        updatedAt: string;
        coachId: string;
        clientId: string;
      }>;
  coachId: string | null;
  userId?: string | null; // Make optional
  createdAt: string;
  updatedAt: string;
  nextLessonDate: string | null;
  lastCompletedWorkout: string | null;
  avatar: string | null;
  dueDate: string | null;
  lastActivity: string | null;
  updates: string | null;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: Client) => void;
}

export default function AddClientModal({
  isOpen,
  onClose,
  onAddClient,
}: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    age: "",
    height: "",
    dominantHand: "",
    movementStyle: "",
    reachingAbility: "",
    averageSpeed: "",
    topSpeed: "",
    dropSpinRate: "",
    changeupSpinRate: "",
    riseSpinRate: "",
    curveSpinRate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const utils = trpc.useUtils();

  // Cast procedure to avoid excessively-deep type instantiation
  const addClient = (trpc.clients.create as any).useMutation({
    onSuccess: (newClient: {
      id: string;
      name: string;
      email: string | null;
      [key: string]: unknown;
    }) => {
      utils.clients.list.invalidate();
      onAddClient({
        ...newClient,
        notes: [], // Add empty notes array to match interface
      } as unknown as Client);
      setFormData({
        name: "",
        email: "",
        phone: "",
        notes: "",
        age: "",
        height: "",
        dominantHand: "",
        movementStyle: "",
        reachingAbility: "",
        averageSpeed: "",
        topSpeed: "",
        dropSpinRate: "",
        changeupSpinRate: "",
        riseSpinRate: "",
        curveSpinRate: "",
      });
      setEmailExists(null);
      setIsSubmitting(false);
      onClose();
    },
    onError: (error: { message?: string }) => {
      console.error("Failed to add client:", error);
      setIsSubmitting(false);
    },
  });

  const checkEmail = async (email: string) => {
    if (!email?.includes("@")) {
      setEmailExists(null);
      return;
    }

    try {
      // Check if client is already assigned to this coach
      const clientExists = await utils.clients.checkClientExistsForCoach.fetch({
        email,
      });
      setEmailExists(clientExists);
    } catch (error) {
      setEmailExists(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      // Show error toast for missing name
      return;
    }

    // Check if email exists before submitting
    if (formData.email && emailExists) {
      return;
    }

    setIsSubmitting(true);
    addClient.mutate({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      height: formData.height.trim() || undefined,
      dominantHand: (formData.dominantHand as "RIGHT" | "LEFT") || undefined,
      movementStyle:
        (formData.movementStyle as "AIRPLANE" | "HELICOPTER") || undefined,
      reachingAbility:
        (formData.reachingAbility as "REACHER" | "NON_REACHER") || undefined,
      averageSpeed: formData.averageSpeed
        ? parseFloat(formData.averageSpeed)
        : undefined,
      topSpeed: formData.topSpeed ? parseFloat(formData.topSpeed) : undefined,
      dropSpinRate: formData.dropSpinRate
        ? parseInt(formData.dropSpinRate)
        : undefined,
      changeupSpinRate: formData.changeupSpinRate
        ? parseInt(formData.changeupSpinRate)
        : undefined,
      riseSpinRate: formData.riseSpinRate
        ? parseInt(formData.riseSpinRate)
        : undefined,
      curveSpinRate: formData.curveSpinRate
        ? parseInt(formData.curveSpinRate)
        : undefined,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "email") {
      checkEmail(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-lg shadow-lg border flex flex-col"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        }}
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
              <User className="h-5 w-5" style={{ color: "#C3BCC2" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#C3BCC2" }}>
                Add New Client
              </h2>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Create a new client profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#ABA4AA" }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#606364";
              e.currentTarget.style.color = "#C3BCC2";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#ABA4AA";
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div
            className="flex-1 overflow-y-auto p-6"
            style={{ maxHeight: "calc(90vh - 200px)" }}
          >
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  Full Name *
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: "#ABA4AA" }}
                  />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#4A5A70";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(74, 90, 112, 0.2)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "#606364";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="Enter client name"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: "#ABA4AA" }}
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#4A5A70";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(74, 90, 112, 0.2)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "#606364";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="client@example.com"
                  />
                </div>
                {formData.email && emailExists !== null && (
                  <div className="flex items-center gap-2 mt-2">
                    {emailExists ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <p className="text-xs" style={{ color: "#10B981" }}>
                          Will automatically link when they sign up
                        </p>
                      </>
                    ) : (
                      <>
                        <Circle
                          className="h-4 w-4"
                          style={{ color: "#ABA4AA" }}
                        />
                        <p className="text-xs" style={{ color: "#ABA4AA" }}>
                          New client - they can register later
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: "#ABA4AA" }}
                  />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#4A5A70";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(74, 90, 112, 0.2)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "#606364";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#4A5A70";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(74, 90, 112, 0.2)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#606364";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Additional notes about the client..."
                />
              </div>

              {/* Pitching Information Section */}
              <div className="pt-4 border-t border-gray-600/50">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Pitching Information
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="age"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="Age"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="height"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Height
                    </label>
                    <input
                      type="text"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="e.g., 6'2&quot;, 185cm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="dominantHand"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Dominant Hand
                    </label>
                    <select
                      id="dominantHand"
                      name="dominantHand"
                      value={formData.dominantHand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <option value="">Select hand</option>
                      <option value="RIGHT">Right</option>
                      <option value="LEFT">Left</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="movementStyle"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Movement Style
                    </label>
                    <select
                      id="movementStyle"
                      name="movementStyle"
                      value={formData.movementStyle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <option value="">Select style</option>
                      <option value="AIRPLANE">Airplane</option>
                      <option value="HELICOPTER">Helicopter</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="reachingAbility"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Reaching Ability
                    </label>
                    <select
                      id="reachingAbility"
                      name="reachingAbility"
                      value={formData.reachingAbility}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <option value="">Select ability</option>
                      <option value="REACHER">Reacher</option>
                      <option value="NON_REACHER">Non Reacher</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="averageSpeed"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Average Speed (mph)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="averageSpeed"
                      name="averageSpeed"
                      value={formData.averageSpeed}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="topSpeed"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Top Speed (mph)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      id="topSpeed"
                      name="topSpeed"
                      value={formData.topSpeed}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="dropSpinRate"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Drop Spin Rate (rpm)
                    </label>
                    <input
                      type="number"
                      id="dropSpinRate"
                      name="dropSpinRate"
                      value={formData.dropSpinRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="changeupSpinRate"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Changeup Spin Rate (rpm)
                    </label>
                    <input
                      type="number"
                      id="changeupSpinRate"
                      name="changeupSpinRate"
                      value={formData.changeupSpinRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="riseSpinRate"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Rise Spin Rate (rpm)
                    </label>
                    <input
                      type="number"
                      id="riseSpinRate"
                      name="riseSpinRate"
                      value={formData.riseSpinRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="curveSpinRate"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#C3BCC2" }}
                    >
                      Curve Spin Rate (rpm)
                    </label>
                    <input
                      type="number"
                      id="curveSpinRate"
                      name="curveSpinRate"
                      value={formData.curveSpinRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4A5A70";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(74, 90, 112, 0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#606364";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-600/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border transition-colors font-medium"
              style={{
                borderColor: "#606364",
                color: "#C3BCC2",
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
                e.currentTarget.style.borderColor = "#ABA4AA";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#606364";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                Boolean(!formData.name.trim()) ||
                Boolean(formData.email && emailExists === true)
              }
              className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#606364";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2"
                    style={{ borderColor: "#C3BCC2" }}
                  />
                  Adding...
                </div>
              ) : (
                "Add Client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
