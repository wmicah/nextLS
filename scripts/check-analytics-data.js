const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAnalyticsData() {
  try {
    console.log("🔍 Checking Analytics Data...\n");

    // Check total counts
    const totalUsers = await prisma.user.count();
    const totalClients = await prisma.client.count();
    const totalCoaches = await prisma.user.count({ where: { role: "COACH" } });
    const totalPrograms = await prisma.program.count();
    const totalProgramAssignments = await prisma.programAssignment.count();
    const totalProgramDrills = await prisma.programDrill.count();
    const totalDrillCompletions = await prisma.drillCompletion.count();

    console.log("📊 Database Overview:");
    console.log(`- Total Users: ${totalUsers}`);
    console.log(`- Total Clients: ${totalClients}`);
    console.log(`- Total Coaches: ${totalCoaches}`);
    console.log(`- Total Programs: ${totalPrograms}`);
    console.log(`- Total Program Assignments: ${totalProgramAssignments}`);
    console.log(`- Total Program Drills: ${totalProgramDrills}`);
    console.log(`- Total Drill Completions: ${totalDrillCompletions}\n`);

    if (totalDrillCompletions === 0) {
      console.log(
        "❌ No drill completions found! This is why analytics show 0."
      );
      console.log("💡 To test analytics, you need to:");
      console.log("   1. Create a program with drills");
      console.log("   2. Assign the program to a client");
      console.log("   3. Have the client complete some drills");
      return;
    }

    // Check drill completions by coach
    const drillCompletionsByCoach = await prisma.drillCompletion.findMany({
      include: {
        client: {
          include: {
            coach: true,
          },
        },
      },
    });

    const coachStats = {};
    drillCompletionsByCoach.forEach(completion => {
      const coachId = completion.client.coachId;
      const coachName =
        completion.client.coach.name || completion.client.coach.email;

      if (!coachStats[coachId]) {
        coachStats[coachId] = {
          name: coachName,
          completions: 0,
          clients: new Set(),
        };
      }

      coachStats[coachId].completions++;
      coachStats[coachId].clients.add(completion.clientId);
    });

    console.log("👨‍💼 Drill Completions by Coach:");
    Object.entries(coachStats).forEach(([coachId, stats]) => {
      console.log(
        `- ${stats.name} (${coachId}): ${stats.completions} completions from ${stats.clients.size} clients`
      );
    });

    // Check recent completions
    const recentCompletions = await prisma.drillCompletion.findMany({
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        client: {
          include: {
            coach: true,
          },
        },
        drill: true,
      },
    });

    console.log("\n📅 Recent Drill Completions:");
    recentCompletions.forEach((completion, index) => {
      console.log(
        `${index + 1}. ${completion.drill.title} - ${
          completion.client.coach.name
        } - ${completion.completedAt.toISOString()}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking analytics data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnalyticsData();

