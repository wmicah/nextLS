// NextLevel Coaching - File Upload Security
import { z } from "zod";

// Allowed video file extensions (for mobile device compatibility)
export const ALLOWED_VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".m4v",
  ".3gp",
  ".3gpp",
  ".mkv",
  ".flv",
  ".wmv",
  ".ogv",
  ".mpeg",
  ".mpg",
  ".m4a", // Sometimes used for video on mobile
  ".hevc", // H.265/HEVC
  ".h265", // H.265 alternative extension
  ".h264", // H.264
  ".ts", // MPEG transport stream
  ".mts", // MPEG transport stream (AVCHD)
  ".vob", // DVD video
  ".asf", // Advanced Systems Format
  ".rm", // RealMedia
  ".rmvb", // RealMedia Variable Bitrate
  ".divx", // DivX
  ".xvid", // Xvid
  ".f4v", // Flash Video
  ".m2v", // MPEG-2 Video
  ".mxf", // Material Exchange Format
  ".dv", // Digital Video
  ".yuv", // Raw video format
] as const;

// Allowed video MIME types (for mobile device compatibility)
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-m4v",
  "video/3gpp",
  "video/3gpp2",
  "video/x-matroska",
  "video/x-flv",
  "video/x-ms-wmv",
  "video/ogg",
  "video/mpeg",
  "video/x-m4a", // Sometimes used for video on mobile
  "video/hevc", // H.265/HEVC
  "video/h265", // H.265 alternative
  "video/h264", // H.264
  "video/mp2t", // MPEG transport stream (.ts, .mts)
  "video/dvd", // DVD video (.vob)
  "video/x-ms-asf", // Advanced Systems Format (.asf)
  "video/vnd.rn-realvideo", // RealMedia (.rm, .rmvb)
  "video/x-divx", // DivX
  "video/x-f4v", // Flash Video (.f4v)
  "video/m2v", // MPEG-2 Video
  "application/mxf", // Material Exchange Format (.mxf)
  "video/x-dv", // Digital Video (.dv)
  "video/*", // Fallback for any video type
] as const;

// Allowed file types with their MIME types and extensions
export const ALLOWED_FILE_TYPES = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],

  // Videos - expanded for mobile compatibility
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/x-m4v": [".m4v"],
  "video/3gpp": [".3gp", ".3gpp"],
  "video/3gpp2": [".3gpp2"],
  "video/x-matroska": [".mkv"],
  "video/x-flv": [".flv"],
  "video/x-ms-wmv": [".wmv"],
  "video/ogg": [".ogv"],
  "video/mpeg": [".mpeg", ".mpg"],
  "video/x-m4a": [".m4a"],
  "video/hevc": [".hevc", ".h265"],
  "video/h265": [".hevc", ".h265"],
  "video/h264": [".h264"],
  "video/mp2t": [".ts", ".mts"],
  "video/dvd": [".vob"],
  "video/x-ms-asf": [".asf"],
  "video/vnd.rn-realvideo": [".rm", ".rmvb"],
  "video/x-divx": [".divx", ".xvid"],
  "video/x-f4v": [".f4v"],
  "video/m2v": [".m2v"],
  "application/mxf": [".mxf"],
  "video/x-dv": [".dv"],

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
  video: 1024 * 1024 * 1024, // 1GB (increased for mobile videos)
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

  // Extract file name and extension once for all checks
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf("."));

  // 2. Check file type
  // For video uploads, be more lenient - accept any video/* MIME type or check extension
  if (uploadType === "video" || uploadType === "feedbackVideo") {
    // Check if it's a video MIME type (starts with "video/")
    const isVideoMimeType = file.type && file.type.startsWith("video/");

    // Check if extension is in allowed video extensions
    const isVideoExtension =
      fileExtension && ALLOWED_VIDEO_EXTENSIONS.includes(fileExtension as any);

    // Check if MIME type is empty/unknown (common on mobile devices)
    const isUnknownMimeType =
      !file.type ||
      file.type === "" ||
      file.type === "application/octet-stream";

    // Allow if:
    // 1. MIME type starts with "video/" (any video format)
    // 2. MIME type is unknown BUT extension is valid (mobile devices)
    // Reject if:
    // 1. MIME type is not video AND extension is not video
    // 2. MIME type is unknown AND extension is not video
    if (isVideoMimeType) {
      // Valid video MIME type - allow
    } else if (isUnknownMimeType && isVideoExtension) {
      // Unknown MIME type but valid extension - allow with warning (common on mobile)
      warnings.push(
        "File MIME type is unknown, but extension suggests it's a video file"
      );
    } else if (!isVideoExtension) {
      // Invalid extension
      errors.push(
        `File extension '${
          fileExtension || "none"
        }' is not allowed. Please upload a video file. Supported formats: ${ALLOWED_VIDEO_EXTENSIONS.join(
          ", "
        )}`
      );
      riskLevel = "high";
    } else {
      // Known MIME type that's not video
      errors.push(
        `File type '${
          file.type
        }' is not allowed. Please upload a video file. Supported formats: ${ALLOWED_VIDEO_EXTENSIONS.join(
          ", "
        )}`
      );
      riskLevel = "high";
    }
  } else {
    // For non-video uploads, use strict MIME type checking
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      errors.push(`File type '${file.type}' is not allowed`);
      riskLevel = "high";
    }
  }

  // 3. Check file extension

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
