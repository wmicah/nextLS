import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

export function getFileKeyFromUrl(url: string): string | null {
  try {
    // UploadThing URLs look like: https://utfs.io/f/[FILE_KEY]
    if (url.includes("utfs.io/f/")) {
      const urlParts = url.split("/f/")
      return urlParts[1] || null
    }

    // Handle other UploadThing URL formats
    const urlParts = url.split("/")
    const fileKey = urlParts[urlParts.length - 1]
    return fileKey || null
  } catch (error) {
    console.error("Error extracting file key:", error)
    return null
  }
}

export async function deleteFileFromUploadThing(url: string): Promise<boolean> {
  try {
    const fileKey = getFileKeyFromUrl(url)
    if (!fileKey) {
      console.warn("Could not extract file key from URL:", url)
      return false
    }

    await utapi.deleteFiles([fileKey])
    console.log(`Successfully deleted file: ${fileKey}`)
    return true
  } catch (error) {
    console.error("Error deleting file from UploadThing:", error)
    return false
  }
}
