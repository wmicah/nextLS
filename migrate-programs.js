const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function migratePrograms() {
  console.log("🔧 Starting program day migration...");

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

          // If we have days 1-7, check if they need remapping
          if (
            dayNumbers.length === 7 &&
            dayNumbers[0] === 1 &&
            dayNumbers[6] === 7
          ) {
            // Check if the first day is not "Monday" (old pattern)
            const firstDay = week.days.find(d => d.dayNumber === 1);
            if (firstDay && firstDay.title === "Sunday") {
              needsFix = true;
              console.log(
                `    ⚠️  Needs fix: First day is Sunday (old pattern)`
              );
            }
          }
        }
      }

      if (needsFix) {
        console.log(`🔧 Fixing program: ${program.title}`);

        // Remap day numbers: 1->7, 2->1, 3->2, 4->3, 5->4, 6->5, 7->6
        const dayRemapping = {
          1: 7, // Sunday becomes Day 7
          2: 1, // Monday becomes Day 1
          3: 2, // Tuesday becomes Day 2
          4: 3, // Wednesday becomes Day 3
          5: 4, // Thursday becomes Day 4
          6: 5, // Friday becomes Day 5
          7: 6, // Saturday becomes Day 6
        };

        for (const week of program.weeks) {
          for (const day of week.days) {
            const newDayNumber = dayRemapping[day.dayNumber];
            if (newDayNumber) {
              await prisma.programDay.update({
                where: { id: day.id },
                data: { dayNumber: newDayNumber },
              });
            }
          }
        }

        fixedCount++;
        console.log(`✅ Fixed program: ${program.title}`);
      } else {
        console.log(`    ✅ Program structure looks correct`);
      }
    }

    console.log(`\n🎉 Migration complete! Fixed ${fixedCount} programs.`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePrograms();
