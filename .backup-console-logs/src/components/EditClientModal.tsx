"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { extractNoteContent } from "@/lib/note-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Trash2 } from "lucide-react";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes?:
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
    age?: number | null;
    height?: string | null;
    customFields?: Record<string, string | number | boolean> | null;
  };
}

export default function EditClientModal({
  isOpen,
  onClose,
  client,
}: EditClientModalProps) {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    notes: client.notes
      ? Array.isArray(client.notes)
        ? ""
        : client.notes
      : "",
    age: client.age || "",
    height: client.height || "",
  });
  const [customFields, setCustomFields] = useState<
    Array<{ key: string; value: string; type: "text" | "number" | "boolean" }>
  >(
    client.customFields
      ? Object.entries(client.customFields).map(([key, value]) => ({
          key,
          value: String(value),
          type:
            typeof value === "number"
              ? "number"
              : typeof value === "boolean"
              ? "boolean"
              : "text",
        }))
      : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const { addToast } = useUIStore();
  const utils = trpc.useUtils();

  // Update form data when client prop changes
  useEffect(() => {
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      notes: Array.isArray(client.notes) ? "" : client.notes || "",
      age: client.age || "",
      height: client.height || "",
    });
    setCustomFields(
      client.customFields
        ? Object.entries(client.customFields).map(([key, value]) => ({
            key,
            value: String(value),
            type:
              typeof value === "number"
                ? "number"
                : typeof value === "boolean"
                ? "boolean"
                : "text",
          }))
        : []
    );
  }, [client]);

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: client.id });
      addToast({
        type: "success",
        title: "Client updated",
        message: "Client information has been updated successfully.",
      });
      setIsSubmitting(false);
      onClose();
    },
    onError: error => {
      console.error("Failed to update client:", error);
      addToast({
        type: "error",
        title: "Update failed",
        message: error.message || "Failed to update client information.",
      });
      setIsSubmitting(false);
    },
  });

  const checkEmail = async (email: string) => {
    if (!email?.includes("@")) {
      setEmailExists(null);
      return;
    }

    // Only check if email is different from current client email
    if (email === client.email) {
      setEmailExists(null);
      return;
    }

    try {
      const exists = await utils.user.checkEmailExists.fetch({ email });
      setEmailExists(exists);
    } catch (error) {
      setEmailExists(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast({
        type: "error",
        title: "Validation error",
        message: "Client name is required.",
      });
      return;
    }

    if (emailExists) {
      addToast({
        type: "error",
        title: "Email already exists",
        message: "This email is already registered to another user.",
      });
      return;
    }

    setIsSubmitting(true);
    updateClient.mutate({
      id: client.id,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      age: formData.age ? parseInt(formData.age as string) : undefined,
      height: formData.height.trim() || undefined,
      customFields:
        customFields.length > 0
          ? customFields.reduce((acc, field) => {
              if (field.key.trim()) {
                let value: string | number | boolean = field.value;
                if (field.type === "number") {
                  value = parseFloat(field.value) || 0;
                } else if (field.type === "boolean") {
                  value =
                    field.value.toLowerCase() === "true" || field.value === "1";
                }
                acc[field.key.trim()] = value;
              }
              return acc;
            }, {} as Record<string, string | number | boolean>)
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h3 className="text-xl font-bold text-white">Edit Client</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-white text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
              placeholder="Enter client name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
              placeholder="Enter email address"
            />
            {emailExists !== null && (
              <p
                className={`text-sm mt-1 ${
                  emailExists ? "text-red-400" : "text-green-400"
                }`}
              >
                {emailExists ? "Email already exists" : "Email available"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-white text-sm font-medium">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-white text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
              placeholder="Enter any notes about the client"
              rows={3}
            />
          </div>

          {/* Client Information */}
          <div className="pt-4 border-t border-gray-600/50">
            <h4 className="text-lg font-semibold text-white mb-4">
              Client Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age" className="text-white text-sm font-medium">
                  Age
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
                  placeholder="Age"
                />
              </div>

              <div>
                <Label
                  htmlFor="height"
                  className="text-white text-sm font-medium"
                >
                  Height
                </Label>
                <Input
                  id="height"
                  name="height"
                  type="text"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="mt-2 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500/50"
                  placeholder="e.g., 5'10&quot; or 178cm"
                />
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="pt-4 border-t border-gray-600/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                Custom Metrics
              </h4>
              <Button
                type="button"
                onClick={() =>
                  setCustomFields([
                    ...customFields,
                    { key: "", value: "", type: "text" },
                  ])
                }
                className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-gray-400 text-sm mb-4">
                Add custom metrics specific to your coaching needs. For example:
                "Wing Span", "Weight", "Grip Strength", etc.
              </p>
            ) : (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-gray-800/30 border border-gray-600/30"
                  >
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Input
                          placeholder="Field name"
                          value={field.key}
                          onChange={e => {
                            const updated = [...customFields];
                            updated[index].key = e.target.value;
                            setCustomFields(updated);
                          }}
                          className="bg-gray-800/50 border-gray-600/50 text-white text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={field.type}
                          onChange={e => {
                            const updated = [...customFields];
                            updated[index].type = e.target.value as
                              | "text"
                              | "number"
                              | "boolean";
                            // Reset value when type changes
                            updated[index].value = "";
                            setCustomFields(updated);
                          }}
                          className="w-full bg-gray-800/50 border border-gray-600/50 text-white text-sm rounded-md px-2 py-2"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Yes/No</option>
                        </select>
                      </div>
                      <div className="col-span-4">
                        {field.type === "boolean" ? (
                          <select
                            value={field.value}
                            onChange={e => {
                              const updated = [...customFields];
                              updated[index].value = e.target.value;
                              setCustomFields(updated);
                            }}
                            className="w-full bg-gray-800/50 border border-gray-600/50 text-white text-sm rounded-md px-2 py-2"
                          >
                            <option value="">Select...</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : (
                          <Input
                            placeholder={
                              field.type === "number" ? "Value" : "Enter value"
                            }
                            type={field.type === "number" ? "number" : "text"}
                            step={field.type === "number" ? "0.1" : undefined}
                            value={field.value}
                            onChange={e => {
                              const updated = [...customFields];
                              updated[index].value = e.target.value;
                              setCustomFields(updated);
                            }}
                            className="bg-gray-800/50 border-gray-600/50 text-white text-sm"
                          />
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() =>
                        setCustomFields(
                          customFields.filter((_, i) => i !== index)
                        )
                      }
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-600/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-gray-700/50 hover:bg-gray-600/50 text-white border-gray-600/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || emailExists === true}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Updating..." : "Update Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
