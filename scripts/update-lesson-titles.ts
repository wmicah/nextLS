import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function updateLessonTitles() {
  try {
    console.log("Starting lesson title update...");

    // Get all lessons that need updating
    const lessons = await prisma.event.findMany({
      where: {
        type: "LESSON",
        title: {
          in: ["Lesson", "Lesson with Test Yahoo"], // Update common patterns
        },
      },
      include: {
        coach: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`Found ${lessons.length} lessons to update`);

    let updated = 0;
    let skipped = 0;

    for (const lesson of lessons) {
      if (!lesson.coach) {
        console.log(`Skipping lesson ${lesson.id} - no coach found`);
        skipped++;
        continue;
      }

      const newTitle = `Lesson - ${lesson.coach.name || "Coach"}`;

      await prisma.event.update({
        where: { id: lesson.id },
        data: { title: newTitle },
      });

      console.log(
        `Updated lesson ${lesson.id}: "${lesson.title}" -> "${newTitle}"`
      );
      updated++;
    }

    console.log(`\n✅ Update complete!`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${lessons.length}`);
  } catch (error) {
    console.error("Error updating lesson titles:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateLessonTitles();
