import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  validateFileSecurity,
  uploadRateLimiter,
  validateFileContent,
  type FileValidationInput,
} from "@/lib/file-security";
import { db } from "@/db";

const f = createUploadthing({
  errorFormatter: err => {

    return { message: err.message };
  },
});

export const ourFileRouter = {
  // Profile picture uploader
  profilePictureUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req, files }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      // Rate limiting
      if (!uploadRateLimiter.canUpload(user.id)) {
        throw new Error("Rate limit exceeded - too many uploads");
      }

      // Security validation for each file
      for (const file of files) {
        const fileData: FileValidationInput = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        const validation = validateFileSecurity(fileData, "profilePicture");

        if (!validation.isValid) {

          throw new Error(
            `File security validation failed: ${validation.errors.join(", ")}`
          );
        }

        if (validation.riskLevel === "high") {

          throw new Error("File rejected due to security risk");
        }

        // Log security warnings
        if (validation.warnings.length > 0) {

        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Enhanced security logging

      return { uploadedBy: metadata.userId };
    }),

  // Video uploader for training resources (VIDEO ONLY)
  videoUploader: f({
    video: { maxFileSize: "1024MB", maxFileCount: 1 }, // Increased to 1GB for mobile videos
  })
    .middleware(async ({ req, files }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      // Rate limiting
      if (!uploadRateLimiter.canUpload(user.id)) {
        throw new Error("Rate limit exceeded - too many uploads");
      }

      // Security validation for each file
      for (const file of files) {
        const fileData: FileValidationInput = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        const validation = validateFileSecurity(fileData, "video");

        if (!validation.isValid) {
          const errorDetails = validation.errors.join(", ");
          console.error("Video upload validation failed:", {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            errors: validation.errors,
          });
          throw new Error(
            `File validation failed: ${errorDetails}. Please check your file format and size (max 1GB).`
          );
        }

        if (validation.riskLevel === "high") {
          console.error("Video upload rejected - high risk:", {
            fileName: file.name,
            riskLevel: validation.riskLevel,
          });
          throw new Error("File rejected due to security risk. Please upload a valid video file.");
        }

        // Log security warnings
        if (validation.warnings.length > 0) {
          console.warn("Video upload warnings:", {
            fileName: file.name,
            warnings: validation.warnings,
          });
        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Enhanced security logging

      return { uploadedBy: metadata.userId };
    }),

  // Video uploader for feedback system (VIDEO ONLY)
  feedbackVideoUploader: f({
    video: { maxFileSize: "1024MB", maxFileCount: 1 },
  })
    .middleware(async ({ req, files }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      // Rate limiting
      if (!uploadRateLimiter.canUpload(user.id)) {
        throw new Error("Rate limit exceeded - too many uploads");
      }

      // Security validation for each file
      for (const file of files) {
        const fileData: FileValidationInput = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        const validation = validateFileSecurity(fileData, "feedbackVideo");

        if (!validation.isValid) {

          throw new Error(
            `File security validation failed: ${validation.errors.join(", ")}`
          );
        }

        if (validation.riskLevel === "high") {

          throw new Error("File rejected due to security risk");
        }

        // Log security warnings
        if (validation.warnings.length > 0) {

        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Enhanced security logging

      return { uploadedBy: metadata.userId };
    }),

  // Audio uploader for voice notes
  audioUploader: f({
    audio: { maxFileSize: "1024MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      return {
        userId: user.id,
        userEmail: user.email,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Log the upload for security audit

      return { uploadedBy: metadata.userId };
    }),

  // Message attachment uploader
  messageAttachmentUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "128MB", maxFileCount: 1 },
    audio: { maxFileSize: "64MB", maxFileCount: 1 },
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    "text/plain": { maxFileSize: "8MB", maxFileCount: 1 },
    "text/markdown": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      return {
        userId: user.id,
        userEmail: user.email,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Log the upload for security audit

      return { uploadedBy: metadata.userId };
    }),

  // Screen recording uploader for coach explanations
  screenRecordingUploader: f({
    video: { maxFileSize: "1024MB", maxFileCount: 1 },
    audio: { maxFileSize: "1024MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      return {
        userId: user.id,
        userEmail: user.email,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Log the upload for security audit

      return { uploadedBy: metadata.userId };
    }),

  // Note attachment uploader (images, videos, PDFs)
  noteAttachmentUploader: f({
    image: { maxFileSize: "64MB", maxFileCount: 10 },
    video: { maxFileSize: "512MB", maxFileCount: 10 },
    "application/pdf": { maxFileSize: "64MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      // Verify user is a COACH
      const coach = await db.user.findFirst({
        where: { id: user.id, role: "COACH" },
      });

      if (!coach) {
        throw new Error("Only coaches can upload note attachments");
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      // Log the upload for security audit

      return { uploadedBy: metadata.userId };
    }),

  // Bug report image uploader
  bugReportImageUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async ({ req, files }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files");

      if (!uploadRateLimiter.canUpload(user.id)) {
        throw new Error("Rate limit exceeded - too many uploads");
      }

      for (const file of files) {
        const fileData: FileValidationInput = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        const validation = validateFileSecurity(fileData, "messageAttachment");

        if (!validation.isValid) {
          throw new Error(
            `File security validation failed: ${validation.errors.join(", ")}`
          );
        }

        if (validation.riskLevel === "high") {
          throw new Error("File rejected due to security risk");
        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
