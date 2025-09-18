#!/usr/bin/env tsx

/**
 * Script to update existing exercises with default categories
 * This script categorizes existing exercises based on their titles and descriptions
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// Category mapping based on keywords in titles/descriptions
const categoryKeywords = {
  practice: [
    "drill",
    "technique",
    "skill",
    "swing",
    "putt",
    "chip",
    "pitch",
    "bunker",
    "practice",
    "training",
    "instruction",
    "lesson",
    "coaching",
    "form",
    "stance",
    "grip",
    "alignment",
    "tempo",
    "rhythm",
    "balance",
  ],
  workout: [
    "strength",
    "weight",
    "dumbbell",
    "barbell",
    "squat",
    "deadlift",
    "press",
    "pull",
    "push",
    "bench",
    "row",
    "curl",
    "extension",
    "flexion",
    "muscle",
    "power",
    "force",
    "resistance",
    "gym",
    "fitness",
    "bodyweight",
  ],
  conditioning: [
    "cardio",
    "endurance",
    "stamina",
    "interval",
    "circuit",
    "metabolic",
    "fat burn",
    "aerobic",
    "anaerobic",
    "sprint",
    "run",
    "bike",
    "row",
    "conditioning",
    "fitness",
    "workout",
    "training",
    "exercise",
  ],
  mobility: [
    "stretch",
    "flexibility",
    "mobility",
    "range of motion",
    "warm up",
    "cool down",
    "recovery",
    "yoga",
    "pilates",
    "foam roll",
    "massage",
    "joint",
    "muscle",
    "tissue",
    "release",
    "activation",
    "preparation",
  ],
};

function categorizeExercise(title: string, description: string = ""): string {
  const text = `${title} ${description}`.toLowerCase();

  // Count matches for each category
  const categoryScores = Object.entries(categoryKeywords).map(
    ([category, keywords]) => {
      const score = keywords.reduce((count, keyword) => {
        return count + (text.includes(keyword) ? 1 : 0);
      }, 0);
      return { category, score };
    }
  );

  // Find the category with the highest score
  const bestMatch = categoryScores.reduce(
    (best, current) => {
      return current.score > best.score ? current : best;
    },
    { category: "practice", score: 0 }
  ); // Default to 'practice'

  // If no keywords match, default to 'practice' for golf-related content
  return bestMatch.score > 0 ? bestMatch.category : "practice";
}

async function updateExerciseCategories() {
  console.log("🔄 Starting exercise category update...");

  try {
    // Get all library resources that have empty category
    const resources = await prisma.libraryResource.findMany({
      where: {
        category: "",
      },
    });

    console.log(`📊 Found ${resources.length} resources to categorize`);

    let updatedCount = 0;

    for (const resource of resources) {
      const newCategory = categorizeExercise(
        resource.title,
        resource.description || ""
      );

      await prisma.libraryResource.update({
        where: { id: resource.id },
        data: { category: newCategory },
      });

      updatedCount++;
      console.log(`✅ Updated "${resource.title}" -> ${newCategory}`);
    }

    console.log(
      `🎉 Successfully updated ${updatedCount} resources with categories`
    );

    // Show summary by category
    const categoryCounts = await prisma.libraryResource.groupBy({
      by: ["category"],
      _count: { category: true },
    });

    console.log("\n📈 Category distribution:");
    categoryCounts.forEach(({ category, _count }) => {
      console.log(`  ${category}: ${_count.category} resources`);
    });
  } catch (error) {
    console.error("❌ Error updating exercise categories:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateExerciseCategories()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { updateExerciseCategories };
