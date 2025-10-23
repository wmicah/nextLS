import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function fixProgramDayNumbering() {
  console.log("🔧 Starting program day numbering fix...");

  try {
    // Get all programs that might have the old day numbering
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
      let needsFix = false;
      console.log(`\n📋 Checking program: ${program.title}`);

      // Check if this program has the old day numbering pattern
      // Old pattern: Day 1 = Sunday, Day 2 = Monday, etc.
      // New pattern: Day 1 = Monday, Day 2 = Tuesday, etc.

      for (const week of program.weeks) {
        if (week.days.length >= 7) {
          console.log(`  Week ${week.weekNumber} days:`);
          for (const day of week.days) {
            console.log(`    Day ${day.dayNumber}: ${day.title}`);
          }

          // Check if the first day is Sunday (old pattern)
          const firstDay = week.days[0];
          if (firstDay.dayNumber === 1 && firstDay.title === "Sunday") {
            needsFix = true;
            console.log(`    ⚠️  Needs fix: First day is Sunday (old pattern)`);
            break;
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
            const newDayNumber =
              dayRemapping[day.dayNumber as keyof typeof dayRemapping];
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
      }
    }

    console.log(`🎉 Migration complete! Fixed ${fixedCount} programs.`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixProgramDayNumbering();
