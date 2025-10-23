const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function fixAllPrograms() {
  console.log("🔧 Starting comprehensive program day fix...");

  try {
    // Get all programs
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
    });

    console.log(`📊 Found ${programs.length} programs to check`);

    let fixedCount = 0;

    for (const program of programs) {
      console.log(`\n📋 Checking program: ${program.title}`);
      let needsFix = false;

      for (const week of program.weeks) {
        if (week.days.length >= 7) {
          console.log(`  Week ${week.weekNumber} days:`);
          for (const day of week.days) {
            console.log(`    Day ${day.dayNumber}: ${day.title}`);
          }

          // Check if this program has the old day structure
          // Look for patterns that indicate old numbering
          const dayNumbers = week.days
            .map(d => d.dayNumber)
            .sort((a, b) => a - b);
          const titles = week.days.map(d => d.title);

          // If we have days 1-7 but they're not in the expected order, fix them
          if (
            dayNumbers.length === 7 &&
            dayNumbers[0] === 1 &&
            dayNumbers[6] === 7
          ) {
            // Check if the first day is not "Day 1" or if there's a pattern issue
            const firstDay = week.days.find(d => d.dayNumber === 1);
            if (firstDay && firstDay.title !== "Day 1") {
              needsFix = true;
              console.log(
                `    ⚠️  Needs fix: First day title is "${firstDay.title}" instead of "Day 1"`
              );
            }
          }
        }
      }

      if (needsFix) {
        console.log(`🔧 Fixing program: ${program.title}`);

        // For now, just log what we would do
        console.log(`    Would update day titles to match new structure`);
        fixedCount++;
      } else {
        console.log(`    ✅ Program structure looks correct`);
      }
    }

    console.log(`\n🎉 Analysis complete! ${fixedCount} programs need fixing.`);
  } catch (error) {
    console.error("❌ Error during analysis:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllPrograms();
