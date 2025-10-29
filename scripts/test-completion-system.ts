import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function testCompletionSystem() {
  console.log("Testing completion system...");

  try {
    // Test 1: Check if we can create a new completion
    console.log("\n1. Testing exercise completion creation...");

    // Get an existing client ID
    const existingClient = await prisma.client.findFirst();
    if (!existingClient) {
      throw new Error("No clients found in database");
    }

    const testCompletion = await prisma.exerciseCompletion.create({
      data: {
        clientId: existingClient.id,
        exerciseId: "test-exercise-id",
        programDrillId: "test-program-drill-id",
        completed: true,
        completedAt: new Date(),
      },
    });

    console.log("✅ Created test completion:", testCompletion.id);

    // Test 2: Check if we can query completions
    console.log("\n2. Testing completion queries...");

    const allCompletions = await prisma.exerciseCompletion.findMany({
      take: 5,
    });

    console.log(`✅ Found ${allCompletions.length} completions`);

    // Test 3: Check if we can update a completion
    console.log("\n3. Testing completion updates...");

    const updatedCompletion = await prisma.exerciseCompletion.update({
      where: { id: testCompletion.id },
      data: { completed: false, completedAt: null },
    });

    console.log("✅ Updated completion:", updatedCompletion.completed);

    // Test 4: Check if we can delete a completion
    console.log("\n4. Testing completion deletion...");

    await prisma.exerciseCompletion.delete({
      where: { id: testCompletion.id },
    });

    console.log("✅ Deleted test completion");

    // Test 5: Check migration results
    console.log("\n5. Checking migration results...");

    const migrationStats = await prisma.exerciseCompletion.groupBy({
      by: ["programDrillId"],
      _count: { exerciseId: true },
    });

    console.log("Migration statistics:");
    migrationStats.forEach(stat => {
      console.log(
        `  ${stat.programDrillId}: ${stat._count.exerciseId} exercises`
      );
    });

    console.log(
      "\n✅ All tests passed! The completion system is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompletionSystem();
