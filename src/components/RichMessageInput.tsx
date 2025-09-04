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
} from "lucide-react";

interface RichMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isPending?: boolean;
}

export default function RichMessageInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  placeholder = "Type a message...",
  disabled = false,
  isPending = false,
}: RichMessageInputProps) {
  const [isFormatted, setIsFormatted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFormatting, setShowFormatting] = useState(false);

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
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => setShowFormatting(!showFormatting)}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
            showFormatting
              ? "bg-blue-500/20 text-blue-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
          title="Text formatting"
        >
          <Type className="h-4 w-4" />
        </button>

        {showFormatting && (
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
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
      </div>

      {/* Message Input Area */}
      <div className="flex items-end gap-2">
        {onFileUpload && (
          <button
            type="button"
            onClick={onFileUpload}
            className="p-3 rounded-xl transition-all duration-200 hover:scale-105 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isPending}
            className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 font-medium resize-none overflow-hidden"
            style={{
              backgroundColor: "#2a2a2a",
              borderColor: "#374151",
              color: "#f9fafb",
              border: "1px solid",
              minHeight: "48px",
              maxHeight: "120px",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#6b7280";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(107, 114, 128, 0.1)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#374151";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          {/* Character count and formatting hint */}
          <div className="absolute bottom-2 right-3 text-xs text-gray-500 pointer-events-none">
            {value.length > 0 && <span className="mr-2">{value.length}</span>}
            <span>Shift+Enter for new line</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || disabled || isPending}
          className="p-3 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
          style={{
            backgroundColor: value.trim() ? "#374151" : "#6b7280",
            color: "#ffffff",
          }}
          onMouseEnter={e => {
            if (value.trim() && !disabled && !isPending) {
              e.currentTarget.style.backgroundColor = "#4b5563";
              e.currentTarget.style.transform = "scale(1.1)";
            }
          }}
          onMouseLeave={e => {
            if (value.trim() && !disabled && !isPending) {
              e.currentTarget.style.backgroundColor = "#374151";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {isPending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Formatting Help */}
      {showFormatting && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-800/50 rounded-lg p-2 border border-gray-700">
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
          <p>
            • <code>Shift+Enter</code> for new lines
          </p>
        </div>
      )}
    </div>
  );
}
