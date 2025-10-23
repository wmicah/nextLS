const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function checkProgramDays() {
  console.log("🔍 Checking program day structure...");

  try {
    const programs = await prisma.program.findMany({
      include: {
        weeks: {
          include: {
            days: {
              orderBy: { dayNumber: "asc" },
            },
          },
        },
      },
      take: 3, // Check first 3 programs
    });

    console.log(`📊 Found ${programs.length} programs to check`);

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

checkProgramDays();
