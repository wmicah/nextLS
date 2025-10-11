/**
 * Kinde Management API utilities
 * Used for administrative operations like deleting users
 */

import { config } from "./env";

/**
 * Delete a user from Kinde using the Management API
 * @param userId - The Kinde user ID to delete
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function deleteKindeUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const managementToken = config.auth.kinde.managementApiToken;

  // If no management token is configured, skip Kinde deletion
  // This allows the app to work without the management API token
  if (!managementToken) {
    console.warn(
      "⚠️ KINDE_MANAGEMENT_API_TOKEN not configured. User will be deleted from database but not from Kinde."
    );
    return {
      success: false,
      error: "Management API token not configured",
    };
  }

  try {
    const kindeApiUrl = config.auth.kinde.issuerUrl.replace(/\/$/, "");
    const deleteUrl = `${kindeApiUrl}/api/v1/user?id=${userId}`;

    console.log(`🗑️ Attempting to delete user from Kinde: ${userId}`);

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${managementToken}`,
      },
    });

    if (response.ok) {
      console.log(`✅ Successfully deleted user from Kinde: ${userId}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(
        `❌ Failed to delete user from Kinde: ${response.status} - ${errorText}`
      );
      return {
        success: false,
        error: `Kinde API error: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("❌ Error calling Kinde Management API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if Kinde Management API is configured
 */
export function isKindeManagementApiConfigured(): boolean {
  return !!config.auth.kinde.managementApiToken;
}
