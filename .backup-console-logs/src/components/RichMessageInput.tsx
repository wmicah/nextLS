"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  Send,
  Paperclip,
  Type,
  Eye,
  EyeOff,
} from "lucide-react";
import FormattedMessage from "./FormattedMessage";

interface RichMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isPending?: boolean;
  selectedFile?: {
    file: File;
    uploadData: {
      attachmentUrl: string;
      attachmentType: string;
      attachmentName: string;
      attachmentSize: number;
    };
  } | null;
  onRemoveFile?: () => void;
}

export default function RichMessageInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  placeholder = "Type a message...",
  disabled = false,
  isPending = false,
  selectedFile,
  onRemoveFile,
}: RichMessageInputProps) {
  const [isFormatted, setIsFormatted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  const formatText = (format: "bold" | "italic" | "underline" | "list") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = "";
    let newCursorPos = start;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        newCursorPos = start + 2;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        newCursorPos = start + 1;
        break;
      case "underline":
        formattedText = `__${selectedText}__`;
        newCursorPos = start + 2;
        break;
      case "list":
        formattedText = `• ${selectedText}`;
        newCursorPos = start + 2;
        break;
    }

    const newValue =
      value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);

    // Set cursor position after formatting
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(
          newCursorPos,
          newCursorPos + selectedText.length
        );
      }
    }, 0);
  };

  return (
    <div className="relative">
      {/* Selected File Preview */}
      {selectedFile && (
        <div
          className="mb-3 p-3 rounded-lg border"
          style={{
            backgroundColor: "#1f2937",
            borderColor: "#374151",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedFile.uploadData.attachmentType.startsWith("image/") ? (
                <img
                  src={selectedFile.uploadData.attachmentUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : selectedFile.uploadData.attachmentType.startsWith(
                  "video/"
                ) ? (
                <video
                  src={selectedFile.uploadData.attachmentUrl}
                  className="w-12 h-12 rounded-lg object-cover"
                  controls={false}
                  muted
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center">
                  <Paperclip className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {selectedFile.uploadData.attachmentName}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedFile.uploadData.attachmentType} • Ready to send
                </div>
              </div>
            </div>
            {onRemoveFile && (
              <button
                type="button"
                onClick={onRemoveFile}
                className="p-1 rounded-lg transition-all duration-200 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                title="Remove file"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message Input Area */}
      <div className="flex items-center gap-3">
        {onFileUpload && (
          <button
            type="button"
            onClick={onFileUpload}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        )}

        <div className="flex-1 relative">
          {showPreview && value.trim() ? (
            <div
              className="w-full rounded-lg text-sm resize-none overflow-hidden
               transition-all duration-300 border border-gray-700 px-3 py-2
               leading-[20px] min-h-[40px]"
              style={{
                boxSizing: "border-box",
                backgroundColor: "#2a2a2a",
                color: "#f9fafb",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              <FormattedMessage content={value} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isPending}
              className="w-full rounded-lg text-sm font-medium resize-none overflow-hidden
               transition-all duration-300 border border-gray-700 px-3 py-2
               leading-[20px]" // exact 20px line-height to avoid fractional gaps
              style={{
                boxSizing: "border-box",
                backgroundColor: "#2a2a2a",
                color: "#f9fafb",
                height: "auto",
                maxHeight: "120px",
                // minHeight: "36px", // <- OPTIONAL: 20px line + 16px padding = 36px
              }}
            />
          )}

          {/* Formatting hint - only show when focused or has content */}
          {value.trim() && !showPreview && (
            <div className="absolute bottom-1 right-1 text-xs text-gray-500">
              {value.includes("**") ||
              value.includes("__") ||
              value.includes("*") ||
              value.includes("_") ? (
                <span className="text-blue-400">Rich text detected</span>
              ) : null}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFormatting(!showFormatting)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
            showFormatting
              ? "bg-blue-500/20 text-blue-400"
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
          }`}
          title="Text formatting"
        >
          <Type className="h-4 w-4" />
        </button>

        {value.trim() && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              showPreview
                ? "bg-green-500/20 text-green-400"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
            }`}
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || disabled || isPending}
          className="p-2 rounded-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
          style={{
            backgroundColor: value.trim() ? "#3B82F6" : "#6b7280",
            color: "#ffffff",
          }}
          onMouseEnter={e => {
            if (value.trim() && !disabled && !isPending) {
              e.currentTarget.style.backgroundColor = "#2563EB";
              e.currentTarget.style.transform = "scale(1.1)";
            }
          }}
          onMouseLeave={e => {
            if (value.trim() && !disabled && !isPending) {
              e.currentTarget.style.backgroundColor = "#3B82F6";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Formatting Toolbar - only show when active */}
      {showFormatting && (
        <div className="mt-3 flex items-center gap-1 bg-gray-800/50 rounded-lg p-2 border border-gray-700">
          <button
            type="button"
            onClick={() => formatText("bold")}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText("italic")}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText("underline")}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formatText("list")}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Formatting Help - only show when formatting is active */}
      {showFormatting && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-800/30 rounded-lg p-2 border border-gray-700">
          <p className="mb-1">
            <strong>Formatting shortcuts:</strong>
          </p>
          <p>
            • <code>**text**</code> for <strong>bold</strong>
          </p>
          <p>
            • <code>*text*</code> for <em>italic</em>
          </p>
          <p>
            • <code>__text__</code> for <u>underline</u>
          </p>
          <p>
            • <code>• item</code> for bullet lists
          </p>
        </div>
      )}
    </div>
  );
}
