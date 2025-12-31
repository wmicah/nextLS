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
  // URL regex pattern - matches http(s) URLs (including YouTube)
  // Note: Create new regex instance to avoid global flag state issues
  const getUrlRegex = () => /(https?:\/\/[^\s]+)/g;

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

  // Parse inline markdown (bold, italic, underline) and URLs
  const parseInlineMarkdown = (text: string): ReactNode[] => {
    // First, check if text contains URLs using a new regex instance
    const urlRegex = getUrlRegex();
    const urlMatches = text.match(urlRegex);
    if (urlMatches && urlMatches.length > 0) {
      // Parse URLs first, then apply markdown to non-URL parts
      return parseTextWithUrlsAndMarkdown(text);
    }

    // No URLs, proceed with regular markdown parsing
    return parseMarkdownFormatting(text);
  };

  // Parse text that contains both URLs and markdown
  const parseTextWithUrlsAndMarkdown = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let urlIndex = 0;
    const urlRegex = getUrlRegex();
    const matches = Array.from(text.matchAll(urlRegex));

    matches.forEach((match) => {
      const url = match[0];
      const matchIndex = match.index!;

      // Add text before the URL (with markdown parsing)
      if (matchIndex > lastIndex) {
        const textBeforeUrl = text.slice(lastIndex, matchIndex);
        const parsedBefore = parseMarkdownFormatting(textBeforeUrl);
        parts.push(...parsedBefore);
      }

      // Add the clickable link with proper overflow handling
      // Remove trailing punctuation that might have been included
      const cleanUrl = url.replace(/[.,;:!?]+$/, "");
      parts.push(
        <a
          key={`url-${urlIndex}`}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-words max-w-full cursor-pointer font-medium"
          style={{
            wordBreak: "break-all",
            overflowWrap: "anywhere",
            display: "inline",
            pointerEvents: "auto",
            textDecoration: "underline",
            // Use a visible blue color that works on both light and dark backgrounds
            color: "#3b82f6",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#3b82f6";
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(cleanUrl, "_blank", "noopener,noreferrer");
          }}
        >
          {cleanUrl}
        </a>
      );

      lastIndex = matchIndex + url.length;
      urlIndex++;
    });

    // Add remaining text after last URL (with markdown parsing)
    if (lastIndex < text.length) {
      const textAfterUrl = text.slice(lastIndex);
      const parsedAfter = parseMarkdownFormatting(textAfterUrl);
      parts.push(...parsedAfter);
    }

    return parts;
  };

  // Parse markdown formatting (bold, italic, underline) - no URL parsing
  const parseMarkdownFormatting = (text: string): ReactNode[] => {
    if (!text) return [];

    const parts: ReactNode[] = [];
    let currentText = text;
    let currentIndex = 0;

    // Process bold text first
    const boldMatches = [...currentText.matchAll(/\*\*(.*?)\*\*/g)];
    
    if (boldMatches.length === 0) {
      // No bold found, parse italic and underline
      return parseItalicAndUnderline(text);
    }

    boldMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const innerText = match[1];
      const startIndex = currentText.indexOf(fullMatch);

      // Add text before the match (with italic/underline parsing)
      if (startIndex > currentIndex) {
        const textBefore = currentText.slice(currentIndex, startIndex);
        const parsedBefore = parseItalicAndUnderline(textBefore);
        parts.push(...parsedBefore);
      }

      // Add the bold element (bold text can also contain italic/underline)
      const parsedInner = parseItalicAndUnderline(innerText);
      parts.push(
        <strong key={`bold-${index}`} className="font-bold">
          {parsedInner}
        </strong>
      );

      // Update current index
      currentIndex = startIndex + fullMatch.length;
    });

    // Add remaining text (with italic/underline parsing)
    if (currentIndex < currentText.length) {
      const remainingText = currentText.slice(currentIndex);
      const italicUnderlineParsed = parseItalicAndUnderline(remainingText);
      parts.push(...italicUnderlineParsed);
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
    <div 
      className={`whitespace-pre-wrap break-words ${className}`} 
      style={{ 
        wordBreak: "break-word", 
        overflowWrap: "anywhere",
        maxWidth: "100%",
      }}
    >
      {parseMarkdown(content)}
    </div>
  );
}
