"use client";

import { ReactNode } from "react";

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export default function FormattedMessage({
  content,
  className = "",
}: FormattedMessageProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string): ReactNode[] => {
    if (!text) return [];

    // Split by lines to handle bullet points properly
    const lines = text.split("\n");
    const result: ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      if (line.trim() === "") {
        result.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      // Check if this line is a bullet point
      if (line.trim().startsWith("•")) {
        const bulletText = line.trim().substring(1).trim();
        result.push(
          <div key={`bullet-${lineIndex}`} className="flex items-start">
            <span className="text-gray-400 w-4 text-center flex-shrink-0">
              •
            </span>
            <span className="flex-1">{parseInlineMarkdown(bulletText)}</span>
          </div>
        );
        return;
      }

      // Parse inline markdown for regular lines
      result.push(
        <span key={`line-${lineIndex}`}>
          {parseInlineMarkdown(line)}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });

    return result;
  };

  // Parse inline markdown (bold, italic, underline)
  const parseInlineMarkdown = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let currentText = text;
    let currentIndex = 0;

    // Process bold text first
    const boldMatches = [...currentText.matchAll(/\*\*(.*?)\*\*/g)];
    boldMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const innerText = match[1];
      const startIndex = currentText.indexOf(fullMatch);

      // Add text before the match
      if (startIndex > currentIndex) {
        parts.push(currentText.slice(currentIndex, startIndex));
      }

      // Add the bold element
      parts.push(
        <strong key={`bold-${index}`} className="font-bold">
          {innerText}
        </strong>
      );

      // Update current index
      currentIndex = startIndex + fullMatch.length;
    });

    // Add remaining text
    if (currentIndex < currentText.length) {
      parts.push(currentText.slice(currentIndex));
    }

    // If no bold text was found, process italic and underline
    if (parts.length === 1 && typeof parts[0] === "string") {
      const text = parts[0] as string;
      return parseItalicAndUnderline(text);
    }

    return parts;
  };

  // Parse italic and underline
  const parseItalicAndUnderline = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let currentText = text;
    let currentIndex = 0;

    // Process italic text
    const italicMatches = [...currentText.matchAll(/\*(.*?)\*/g)];
    italicMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const innerText = match[1];
      const startIndex = currentText.indexOf(fullMatch);

      // Add text before the match
      if (startIndex > currentIndex) {
        parts.push(currentText.slice(currentIndex, startIndex));
      }

      // Add the italic element
      parts.push(
        <em key={`italic-${index}`} className="italic">
          {innerText}
        </em>
      );

      // Update current index
      currentIndex = startIndex + fullMatch.length;
    });

    // Add remaining text
    if (currentIndex < currentText.length) {
      parts.push(currentText.slice(currentIndex));
    }

    // If no italic text was found, process underline
    if (parts.length === 1 && typeof parts[0] === "string") {
      const text = parts[0] as string;
      return parseUnderline(text);
    }

    return parts;
  };

  // Parse underline
  const parseUnderline = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let currentText = text;
    let currentIndex = 0;

    // Process underline text
    const underlineMatches = [...currentText.matchAll(/__(.*?)__/g)];
    underlineMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const innerText = match[1];
      const startIndex = currentText.indexOf(fullMatch);

      // Add text before the match
      if (startIndex > currentIndex) {
        parts.push(currentText.slice(currentIndex, startIndex));
      }

      // Add the underline element
      parts.push(
        <u key={`underline-${index}`} className="underline">
          {innerText}
        </u>
      );

      // Update current index
      currentIndex = startIndex + fullMatch.length;
    });

    // Add remaining text
    if (currentIndex < currentText.length) {
      parts.push(currentText.slice(currentIndex));
    }

    return parts;
  };

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
}
