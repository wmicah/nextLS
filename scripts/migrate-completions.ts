import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function migrateCompletions() {
  console.log("Starting completion data migration...");

  try {
    // 1. Get all existing program drill completions
    const existingProgramCompletions =
      await prisma.programDrillCompletion.findMany({
        include: {
          drill: {
            include: {
              routine: {
                include: {
                  exercises: true,
                },
              },
            },
          },
        },
      });

    console.log(
      `Found ${existingProgramCompletions.length} existing program drill completions`
    );

    // 2. Get all existing routine exercise completions
    const existingRoutineCompletions =
      await prisma.routineExerciseCompletion.findMany({
        include: {
          routineAssignment: {
            include: {
              routine: {
                include: {
                  exercises: true,
                },
              },
            },
          },
        },
      });

    console.log(
      `Found ${existingRoutineCompletions.length} existing routine exercise completions`
    );

    // 3. Migrate program drill completions
    for (const completion of existingProgramCompletions) {
      const { clientId, drillId, completedAt } = completion;
      const drill = completion.drill;

      // Check if this drill has a routine
      if (drill.routine && drill.routine.exercises) {
        // This is a routine drill - create individual exercise completions
        console.log(`Migrating routine drill: ${drill.title}`);

        for (const exercise of drill.routine.exercises) {
          await prisma.exerciseCompletion.upsert({
            where: {
              clientId_exerciseId_programDrillId_date: {
                clientId,
                exerciseId: exercise.id,
                programDrillId: drillId,
                date: "",
              },
            },
            update: {
              completed: true,
              completedAt,
            },
            create: {
              clientId,
              exerciseId: exercise.id,
              programDrillId: drillId,
              completed: true,
              completedAt,
              date: "",
            },
          });
        }
      } else {
        // This is a regular drill - migrate as-is
        console.log(`Migrating regular drill: ${drill.title}`);

        // For regular drills, we'll use a special programDrillId to indicate they're standalone
        const standaloneDrillId = "standalone-drill";

        await prisma.exerciseCompletion.upsert({
          where: {
            clientId_exerciseId_programDrillId_date: {
              clientId,
              exerciseId: drillId,
              programDrillId: standaloneDrillId,
              date: "",
            },
          },
          update: {
            completed: true,
            completedAt,
          },
          create: {
            clientId,
            exerciseId: drillId,
            programDrillId: standaloneDrillId,
            completed: true,
            completedAt,
            date: "",
          },
        });
      }
    }

    // 4. Migrate routine exercise completions
    for (const completion of existingRoutineCompletions) {
      const { clientId, exerciseId, completedAt } = completion;

      console.log(`Migrating routine exercise completion: ${exerciseId}`);

      // For routine exercises, we'll use a special programDrillId to indicate they're standalone
      const standaloneRoutineId = "standalone-routine";

      await prisma.exerciseCompletion.upsert({
        where: {
          clientId_exerciseId_programDrillId_date: {
            clientId,
            exerciseId,
            programDrillId: standaloneRoutineId,
            date: "",
          },
        },
        update: {
          completed: true,
          completedAt,
        },
        create: {
          clientId,
          exerciseId,
          programDrillId: standaloneRoutineId,
          completed: true,
          completedAt,
          date: "",
        },
      });
    }

    console.log("Migration completed successfully!");

    // 5. Verify the migration
    const newCompletions = await prisma.exerciseCompletion.count();
    console.log(`New completion records created: ${newCompletions}`);

    // 6. Show some statistics
    const clientStats = await prisma.exerciseCompletion.groupBy({
      by: ["clientId"],
      _count: {
        exerciseId: true,
      },
    });

    console.log(`Migration affected ${clientStats.length} clients`);
    clientStats.forEach(stat => {
      console.log(
        `Client ${stat.clientId}: ${stat._count.exerciseId} exercise completions`
      );
    });
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCompletions();
