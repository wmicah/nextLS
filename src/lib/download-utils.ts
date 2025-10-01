/**
 * Utility functions for downloading files from URLs
 */

export const downloadFile = async (url: string, filename: string) => {
  try {
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.style.display = "none";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);

    return { success: true };
  } catch (error) {
    console.error("Download failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
};

export const downloadVideoFromMessage = async (
  messageId: string,
  trpcClient: any
) => {
  try {
    // Get video metadata from tRPC
    const videoData = await trpcClient.messaging.downloadVideoFromMessage.query(
      {
        messageId,
      }
    );

    // Download the file
    const result = await downloadFile(videoData.videoUrl, videoData.filename);

    return result;
  } catch (error) {
    console.error("Failed to download video:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
};





