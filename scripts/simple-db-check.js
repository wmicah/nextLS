// Simple database check without Prisma client
const { Pool } = require("pg");

// You'll need to set your database URL in the environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkData() {
  try {
    console.log("🔍 Checking database data...\n");

    // Check drill completions
    const drillCompletionsResult = await pool.query(
      "SELECT COUNT(*) FROM drill_completions"
    );
    const drillCompletions = parseInt(drillCompletionsResult.rows[0].count);

    console.log(`📊 Drill Completions: ${drillCompletions}`);

    if (drillCompletions === 0) {
      console.log(
        "❌ No drill completions found! This is why analytics show 0."
      );
      console.log("💡 To test analytics, you need to:");
      console.log("   1. Create a program with drills");
      console.log("   2. Assign the program to a client");
      console.log("   3. Have the client complete some drills");
      return;
    }

    // Check recent completions
    const recentCompletionsResult = await pool.query(`
      SELECT dc.*, c.coach_id, u.name as coach_name
      FROM drill_completions dc
      JOIN clients c ON dc.client_id = c.id
      JOIN users u ON c.coach_id = u.id
      ORDER BY dc.completed_at DESC
      LIMIT 5
    `);

    console.log("\n📅 Recent Drill Completions:");
    recentCompletionsResult.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. Coach: ${row.coach_name} - Completed: ${
          row.completed_at
        }`
      );
    });

    // Check by coach
    const coachStatsResult = await pool.query(`
      SELECT u.name as coach_name, c.coach_id, COUNT(dc.id) as completions
      FROM drill_completions dc
      JOIN clients c ON dc.client_id = c.id
      JOIN users u ON c.coach_id = u.id
      GROUP BY c.coach_id, u.name
    `);

    console.log("\n👨‍💼 Drill Completions by Coach:");
    coachStatsResult.rows.forEach(row => {
      console.log(`- ${row.coach_name}: ${row.completions} completions`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkData();


