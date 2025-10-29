import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log("Verifying migration integrity...");

  try {
    // Check that all old completions have been migrated
    const oldProgramCompletions = await prisma.programDrillCompletion.count();
    const oldRoutineCompletions =
      await prisma.routineExerciseCompletion.count();
    const newCompletions = await prisma.exerciseCompletion.count();

    console.log(`Old program drill completions: ${oldProgramCompletions}`);
    console.log(`Old routine exercise completions: ${oldRoutineCompletions}`);
    console.log(`New exercise completions: ${newCompletions}`);

    // Verify specific clients
    const clients = await prisma.client.findMany({
      take: 5,
      include: {
        exerciseCompletions: true,
      },
    });

    for (const client of clients) {
      const oldProgramCount = await prisma.programDrillCompletion.count({
        where: { clientId: client.id },
      });
      const oldRoutineCount = await prisma.routineExerciseCompletion.count({
        where: { clientId: client.id },
      });
      const newCount = client.exerciseCompletions.length;

      console.log(
        `Client ${client.name}: ${oldProgramCount} old program + ${oldRoutineCount} old routine = ${newCount} new`
      );
    }

    // Check for any missing data
    const clientsWithOldCompletions = await prisma.client.findMany({
      where: {
        OR: [
          {
            programDrillCompletions: {
              some: {},
            },
          },
          {
            routineExerciseCompletions: {
              some: {},
            },
          },
        ],
      },
      include: {
        exerciseCompletions: true,
      },
    });

    console.log(
      `Clients with old completions: ${clientsWithOldCompletions.length}`
    );

    for (const client of clientsWithOldCompletions) {
      const oldProgramCount = await prisma.programDrillCompletion.count({
        where: { clientId: client.id },
      });
      const oldRoutineCount = await prisma.routineExerciseCompletion.count({
        where: { clientId: client.id },
      });
      const newCount = client.exerciseCompletions.length;

      if (newCount === 0 && (oldProgramCount > 0 || oldRoutineCount > 0)) {
        console.log(
          `WARNING: Client ${client.name} has old completions but no new ones!`
        );
      }
    }

    console.log("Migration verification completed!");
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
