const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function check12UProgram() {
  console.log("🔍 Checking 12U (1) program...");

  try {
    const programs = await prisma.program.findMany({
      where: {
        title: {
          contains: "12U",
        },
      },
      include: {
        weeks: {
          include: {
            days: {
              orderBy: { dayNumber: "asc" },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${programs.length} programs with "12U" in title`);

    for (const program of programs) {
      console.log(`\n📋 Program: ${program.title}`);

      for (const week of program.weeks) {
        console.log(`  Week ${week.weekNumber}:`);
        for (const day of week.days) {
          console.log(`    Day ${day.dayNumber}: ${day.title}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

check12UProgram();
