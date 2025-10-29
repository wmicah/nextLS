import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function checkExistingData() {
  console.log("=== EXISTING PROGRAMS ===");
  const programs = await prisma.program.findMany({
    include: {
      weeks: {
        include: {
          days: {
            include: {
              drills: true,
            },
          },
        },
      },
    },
  });
  console.log("Total programs:", programs.length);
  programs.forEach(p => {
    console.log(`- Program: ${p.title} (ID: ${p.id})`);
    console.log(`  Weeks: ${p.weeks.length}`);
    p.weeks.forEach(w => {
      console.log(`    Week ${w.weekNumber}: ${w.days.length} days`);
      w.days.forEach(d => {
        console.log(`      Day ${d.dayNumber}: ${d.drills.length} drills`);
      });
    });
  });

  console.log("\n=== EXISTING PROGRAM ASSIGNMENTS ===");
  const assignments = await prisma.programAssignment.findMany({
    include: {
      program: true,
      client: true,
    },
  });
  console.log("Total program assignments:", assignments.length);
  assignments.forEach(a => {
    console.log(`- Client: ${a.client.userId} -> Program: ${a.program.title}`);
  });

  console.log("\n=== EXISTING ROUTINE ASSIGNMENTS ===");
  const routineAssignments = await prisma.routineAssignment.findMany({
    include: {
      routine: {
        include: {
          exercises: true,
        },
      },
      client: true,
    },
  });
  console.log("Total routine assignments:", routineAssignments.length);
  routineAssignments.forEach(ra => {
    console.log(
      `- Client: ${ra.client.userId} -> Routine: ${ra.routine.name} (${ra.routine.exercises.length} exercises)`
    );
  });

  console.log("\n=== EXISTING EXERCISE COMPLETIONS ===");
  const completions = await prisma.exerciseCompletion.findMany();
  console.log("Total exercise completions:", completions.length);
  const completionsByType = completions.reduce((acc, c) => {
    const type = c.programDrillId || "standalone";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log("Completions by type:", completionsByType);

  await prisma.$disconnect();
}

checkExistingData().catch(console.error);
