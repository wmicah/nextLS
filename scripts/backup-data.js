// Use the backup schema that doesn't have invite_code yet
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function backupData() {
  const prisma = new PrismaClient();

  try {
    console.log("🔄 Starting data backup...");

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`📊 Found ${users.length} users`);

    // Get all clients
    const clients = await prisma.client.findMany();
    console.log(`📊 Found ${clients.length} clients`);

    // Get all programs
    const programs = await prisma.program.findMany();
    console.log(`📊 Found ${programs.length} programs`);

    // Get all messages
    const messages = await prisma.message.findMany();
    console.log(`📊 Found ${messages.length} messages`);

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      users,
      clients,
      programs,
      messages,
      totalUsers: users.length,
      totalClients: clients.length,
      totalPrograms: programs.length,
      totalMessages: messages.length,
    };

    // Save to file
    const backupPath = path.join(
      __dirname,
      `../backups/data-backup-${Date.now()}.json`
    );
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup saved to: ${backupPath}`);
    console.log(`📊 Backup summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Programs: ${programs.length}`);
    console.log(`   - Messages: ${messages.length}`);
  } catch (error) {
    console.error("❌ Backup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backupData();
