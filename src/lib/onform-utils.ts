/**
 * OnForm URL parsing and utility functions
 * Handles OnForm video URL extraction and validation
 */

export interface OnFormVideoData {
  onformId: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
}

/**
 * Extract OnForm video ID from various OnForm URL formats
 * Supports:
 * - https://onform.net/video/12345
 * - https://onform.net/embed/12345
 * - https://app.onform.net/video/12345
 * - https://app.onform.net/embed/12345
 */
export function extractOnFormId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Clean the URL
  const cleanUrl = url.trim();
  
  // OnForm URL patterns
  const patterns = [
    /onform\.net\/video\/([a-zA-Z0-9_-]+)/,
    /onform\.net\/embed\/([a-zA-Z0-9_-]+)/,
    /app\.onform\.net\/video\/([a-zA-Z0-9_-]+)/,
    /app\.onform\.net\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a URL is a valid OnForm video URL
 */
export function isOnFormUrl(url: string): boolean {
  return extractOnFormId(url) !== null;
}

/**
 * Generate OnForm embed URL from video ID
 */
export function generateOnFormEmbedUrl(onformId: string): string {
  return `https://onform.net/embed/${onformId}`;
}

/**
 * Parse OnForm URL and extract video metadata
 */
export function parseOnFormUrl(url: string): OnFormVideoData | null {
  const onformId = extractOnFormId(url);
  
  if (!onformId) {
    return null;
  }

  return {
    onformId,
    // Additional metadata could be fetched from OnForm API here
    // For now, we'll use the ID as the title
    title: `OnForm Video ${onformId}`,
  };
}

/**
 * Validate OnForm video ID format
 */
export function isValidOnFormId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // OnForm IDs are typically alphanumeric with underscores and hyphens
  const onformIdPattern = /^[a-zA-Z0-9_-]+$/;
  return onformIdPattern.test(id) && id.length > 0;
}

/**
 * Get OnForm video thumbnail URL (if available)
 * Note: This would require OnForm API access for actual thumbnails
 */
export function getOnFormThumbnailUrl(onformId: string): string | null {
  // OnForm doesn't provide public thumbnail URLs without API access
  // This would need to be implemented with OnForm API integration
  return null;
}

