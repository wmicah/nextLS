const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateVideoUrls() {
  try {
    console.log("Starting video URL update...");

    // Find all library resources with secure://master-library URLs
    const resources = await prisma.libraryResource.findMany({
      where: {
        url: {
          startsWith: "secure://master-library/",
        },
      },
    });

    console.log(`Found ${resources.length} resources with old URLs`);

    for (const resource of resources) {
      // Extract filename from the old URL
      const oldUrl = resource.url;
      const filename = oldUrl.replace("secure://master-library/", "");

      // Create new URL
      const newUrl = `/api/master-video/${encodeURIComponent(filename)}`;

      console.log(`Updating: ${oldUrl} -> ${newUrl}`);

      // Update the resource
      await prisma.libraryResource.update({
        where: { id: resource.id },
        data: { url: newUrl },
      });
    }

    console.log("Video URL update completed successfully!");
  } catch (error) {
    console.error("Error updating video URLs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVideoUrls();
