/**
 * One-time migration script to update existing exercises with default categories
 * Run this with: node scripts/migrate-exercise-categories.js
 */

const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

// Simple category mapping based on common patterns
const categorizeExercise = (title, description = "") => {
  const text = `${title} ${description}`.toLowerCase();

  // Check for workout-related keywords
  if (
    text.includes("strength") ||
    text.includes("weight") ||
    text.includes("dumbbell") ||
    text.includes("barbell") ||
    text.includes("squat") ||
    text.includes("deadlift") ||
    text.includes("press") ||
    text.includes("pull") ||
    text.includes("push") ||
    text.includes("bench") ||
    text.includes("row") ||
    text.includes("curl") ||
    text.includes("muscle") ||
    text.includes("power") ||
    text.includes("gym")
  ) {
    return "workout";
  }

  // Check for conditioning-related keywords
  if (
    text.includes("cardio") ||
    text.includes("endurance") ||
    text.includes("stamina") ||
    text.includes("interval") ||
    text.includes("circuit") ||
    text.includes("metabolic") ||
    text.includes("fat burn") ||
    text.includes("aerobic") ||
    text.includes("anaerobic") ||
    text.includes("sprint") ||
    text.includes("run") ||
    text.includes("bike") ||
    text.includes("conditioning") ||
    text.includes("fitness")
  ) {
    return "conditioning";
  }

  // Check for mobility-related keywords
  if (
    text.includes("stretch") ||
    text.includes("flexibility") ||
    text.includes("mobility") ||
    text.includes("range of motion") ||
    text.includes("warm up") ||
    text.includes("cool down") ||
    text.includes("recovery") ||
    text.includes("yoga") ||
    text.includes("pilates") ||
    text.includes("foam roll") ||
    text.includes("massage") ||
    text.includes("joint") ||
    text.includes("release") ||
    text.includes("activation")
  ) {
    return "mobility";
  }

  // Check for practice-related keywords (golf-specific)
  if (
    text.includes("drill") ||
    text.includes("technique") ||
    text.includes("skill") ||
    text.includes("swing") ||
    text.includes("putt") ||
    text.includes("chip") ||
    text.includes("pitch") ||
    text.includes("bunker") ||
    text.includes("practice") ||
    text.includes("training") ||
    text.includes("instruction") ||
    text.includes("lesson") ||
    text.includes("coaching") ||
    text.includes("form") ||
    text.includes("stance") ||
    text.includes("grip") ||
    text.includes("alignment") ||
    text.includes("tempo") ||
    text.includes("rhythm") ||
    text.includes("balance")
  ) {
    return "practice";
  }

  // Default to 'practice' for golf-related content
  return "practice";
};

async function migrateExerciseCategories() {
  console.log("🔄 Starting exercise category migration...");

  try {
    // Get all library resources
    const resources = await prisma.libraryResource.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    });

    console.log(`📊 Found ${resources.length} total resources`);

    let updatedCount = 0;
    const categoryCounts = {
      practice: 0,
      workout: 0,
      conditioning: 0,
      mobility: 0,
      unchanged: 0,
    };

    for (const resource of resources) {
      const newCategory = categorizeExercise(
        resource.title,
        resource.description || ""
      );

      // Only update if category is different
      if (resource.category !== newCategory) {
        await prisma.libraryResource.update({
          where: { id: resource.id },
          data: { category: newCategory },
        });

        updatedCount++;
        console.log(
          `✅ Updated "${resource.title}" (${
            resource.category || "null"
          } -> ${newCategory})`
        );
      } else {
        categoryCounts.unchanged++;
      }

      categoryCounts[newCategory]++;
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📈 Updated ${updatedCount} resources`);
    console.log(`📊 Category distribution:`);
    console.log(`  Practice: ${categoryCounts.practice}`);
    console.log(`  Workout: ${categoryCounts.workout}`);
    console.log(`  Conditioning: ${categoryCounts.conditioning}`);
    console.log(`  Mobility: ${categoryCounts.mobility}`);
    console.log(`  Unchanged: ${categoryCounts.unchanged}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExerciseCategories()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });

