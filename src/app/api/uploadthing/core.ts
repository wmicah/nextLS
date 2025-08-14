import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

const f = createUploadthing()

export const ourFileRouter = {
  // Video uploader for training resources
  videoUploader: f({
    video: { maxFileSize: "512MB", maxFileCount: 1 },
    "application/pdf": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Authenticate user
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user?.id)
        throw new Error("Unauthorized - Please log in to upload files")

      return {
        userId: user.id,
        userEmail: user.email,
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId)
      console.log("File URL:", file.url)

      // Log the upload for security audit
      console.log(`User ${metadata.userEmail} uploaded: ${file.name}`)

      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
