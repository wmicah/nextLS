import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  validateFileSecurity,
  uploadRateLimiter,
  validateFileContent,
  type FileValidationInput,
} from "@/lib/file-security";

const f = createUploadthing({
  errorFormatter: err => {
    console.error("UploadThing error:", err);
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
          console.error(
            `Security validation failed for ${file.name}:`,
            validation.errors
          );
          throw new Error(
            `File security validation failed: ${validation.errors.join(", ")}`
          );
        }

        if (validation.riskLevel === "high") {
          console.error(`High risk file detected: ${file.name}`);
          throw new Error("File rejected due to security risk");
        }

        // Log security warnings
        if (validation.warnings.length > 0) {
          console.warn(
            `Security warnings for ${file.name}:`,
            validation.warnings
          );
        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Profile picture upload complete for userId:",
        metadata.userId
      );
      console.log("File URL:", file.url);

      // Enhanced security logging
      console.log(
        `SECURITY_AUDIT: User ${metadata.userEmail} uploaded profile picture: ${file.name} at ${metadata.timestamp}`
      );

      return { uploadedBy: metadata.userId };
    }),

  // Video uploader for training resources (VIDEO ONLY)
  videoUploader: f({
    video: { maxFileSize: "512MB", maxFileCount: 1 },
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
          console.error(
            `Security validation failed for ${file.name}:`,
            validation.errors
          );
          throw new Error(
            `File security validation failed: ${validation.errors.join(", ")}`
          );
        }

        if (validation.riskLevel === "high") {
          console.error(`High risk file detected: ${file.name}`);
          throw new Error("File rejected due to security risk");
        }

        // Log security warnings
        if (validation.warnings.length > 0) {
          console.warn(
            `Security warnings for ${file.name}:`,
            validation.warnings
          );
        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Enhanced security logging
      console.log(
        `SECURITY_AUDIT: User ${metadata.userEmail} uploaded video: ${file.name} at ${metadata.timestamp}`
      );

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
          console.error(
            `Security validation failed for ${file.name}:`,
            validation.errors
          );
          throw new Error(
            `File security validation failed: ${validation.errors.join(", ")}`
          );
        }

        if (validation.riskLevel === "high") {
          console.error(`High risk file detected: ${file.name}`);
          throw new Error("File rejected due to security risk");
        }

        // Log security warnings
        if (validation.warnings.length > 0) {
          console.warn(
            `Security warnings for ${file.name}:`,
            validation.warnings
          );
        }
      }

      return {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Feedback video upload complete for userId:",
        metadata.userId
      );
      console.log("File URL:", file.url);

      // Enhanced security logging
      console.log(
        `SECURITY_AUDIT: User ${metadata.userEmail} uploaded feedback video: ${file.name} at ${metadata.timestamp}`
      );

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
      console.log("Audio upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Log the upload for security audit
      console.log(`User ${metadata.userEmail} uploaded audio: ${file.name}`);

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
      console.log(
        "Message attachment upload complete for userId:",
        metadata.userId
      );
      console.log("File URL:", file.url);

      // Log the upload for security audit
      console.log(
        `User ${metadata.userEmail} uploaded message attachment: ${file.name}`
      );

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
      console.log(
        "Screen recording upload complete for userId:",
        metadata.userId
      );
      console.log("File URL:", file.url);

      // Log the upload for security audit
      console.log(
        `User ${metadata.userEmail} uploaded screen recording: ${file.name}`
      );

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
