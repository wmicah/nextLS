// NextLevel Coaching - File Upload Security
import { z } from "zod";

// Allowed file types with their MIME types and extensions
export const ALLOWED_FILE_TYPES = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],

  // Videos
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],

  // Audio
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "audio/webm": [".webm"],

  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  profilePicture: 4 * 1024 * 1024, // 4MB
  video: 512 * 1024 * 1024, // 512MB
  audio: 64 * 1024 * 1024, // 64MB
  document: 32 * 1024 * 1024, // 32MB
  messageAttachment: 16 * 1024 * 1024, // 16MB
  feedbackVideo: 1024 * 1024 * 1024, // 1GB
} as const;

// Dangerous file extensions to block
export const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
  ".sh",
  ".ps1",
  ".dll",
  ".so",
  ".dylib",
  ".app",
  ".deb",
  ".rpm",
  ".msi",
  ".dmg",
];

// File validation schema
export const fileValidationSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().positive(),
  type: z.string(),
  lastModified: z.number().optional(),
});

export type FileValidationInput = z.infer<typeof fileValidationSchema>;

// Security validation result
export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFileName: string;
  riskLevel: "low" | "medium" | "high";
}

/**
 * Validate file security
 */
export function validateFileSecurity(
  file: FileValidationInput,
  uploadType: keyof typeof FILE_SIZE_LIMITS
): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  // 1. Check file size
  const maxSize = FILE_SIZE_LIMITS[uploadType];
  if (file.size > maxSize) {
    errors.push(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${(
        maxSize /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );
    riskLevel = "high";
  }

  // 2. Check file type
  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    errors.push(`File type '${file.type}' is not allowed`);
    riskLevel = "high";
  }

  // 3. Check file extension
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf("."));

  if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
    errors.push(`File extension '${fileExtension}' is not allowed`);
    riskLevel = "high";
  }

  // 4. Check for double extensions (e.g., file.jpg.exe)
  const extensionCount = (fileName.match(/\./g) || []).length;
  if (extensionCount > 1) {
    warnings.push("File has multiple extensions - potential security risk");
    riskLevel = "medium";
  }

  // 5. Check for suspicious characters in filename
  const suspiciousChars = /[<>:"|?*\x00-\x1f]/;
  if (suspiciousChars.test(fileName)) {
    errors.push("Filename contains invalid characters");
    riskLevel = "high";
  }

  // 6. Check for extremely long filenames
  if (fileName.length > 200) {
    warnings.push("Filename is very long");
    riskLevel = "medium";
  }

  // 7. Sanitize filename
  const sanitizedFileName = sanitizeFileName(fileName);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedFileName,
    riskLevel,
  };
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"|?*\x00-\x1f]/g, "") // Remove invalid characters
    .replace(/\.\./g, "") // Remove path traversal attempts
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\.+$/, "") // Remove trailing dots
    .substring(0, 200) // Limit length
    .trim();
}

/**
 * Check if file content matches its MIME type
 */
export async function validateFileContent(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      // Check file signatures (magic numbers)
      const isValid = checkFileSignature(uint8Array, file.type);
      resolve(isValid);
    };

    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 1024)); // Read first 1KB
  });
}

/**
 * Check file signature against MIME type
 */
function checkFileSignature(uint8Array: Uint8Array, mimeType: string): boolean {
  const signatures: Record<string, number[][]> = {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    "image/gif": [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    ],
    "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
    "video/mp4": [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]],
  };

  const expectedSignatures = signatures[mimeType];
  if (!expectedSignatures) return true; // No signature to check

  return expectedSignatures.some(signature =>
    signature.every((byte, index) => uint8Array[index] === byte)
  );
}

/**
 * Rate limiting for file uploads
 */
export class UploadRateLimiter {
  private uploads: Map<string, number[]> = new Map();
  private readonly maxUploads: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxUploads: number = 10, timeWindow: number = 60 * 1000) {
    this.maxUploads = maxUploads;
    this.timeWindow = timeWindow;
  }

  canUpload(userId: string): boolean {
    const now = Date.now();
    const userUploads = this.uploads.get(userId) || [];

    // Remove old uploads outside time window
    const recentUploads = userUploads.filter(
      time => now - time < this.timeWindow
    );

    if (recentUploads.length >= this.maxUploads) {
      return false;
    }

    // Add current upload
    recentUploads.push(now);
    this.uploads.set(userId, recentUploads);

    return true;
  }

  getRemainingUploads(userId: string): number {
    const now = Date.now();
    const userUploads = this.uploads.get(userId) || [];
    const recentUploads = userUploads.filter(
      time => now - time < this.timeWindow
    );

    return Math.max(0, this.maxUploads - recentUploads.length);
  }
}

// Global rate limiter instance
export const uploadRateLimiter = new UploadRateLimiter(10, 60 * 1000); // 10 uploads per minute
