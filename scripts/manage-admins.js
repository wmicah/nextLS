/**
 * Admin Management Script
 * This script helps you manage admin users in your database
 */

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("🔧 Admin Management Script\n");

  try {
    // Get all admin users
    const admins = await db.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("📋 Current Admin Users:");
    if (admins.length === 0) {
      console.log("   No admin users found");
    } else {
      admins.forEach((admin, index) => {
        console.log(
          `   ${index + 1}. ${admin.email} (${admin.name || "No name"})`
        );
        console.log(`      ID: ${admin.id}`);
        console.log(`      Created: ${admin.createdAt.toISOString()}`);
        console.log(
          `      Last Login: ${
            admin.lastLoginAt ? admin.lastLoginAt.toISOString() : "Never"
          }`
        );
        console.log("");
      });
    }

    // Get admin statistics
    const totalAdmins = await db.user.count({ where: { isAdmin: true } });
    const totalUsers = await db.user.count();
    const adminPercentage =
      totalUsers > 0 ? ((totalAdmins / totalUsers) * 100).toFixed(2) : 0;

    console.log("📊 Admin Statistics:");
    console.log(`   Total Admins: ${totalAdmins}`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Percentage: ${adminPercentage}%\n`);

    // Show usage instructions
    console.log("🚀 Usage Instructions:");
    console.log("   1. To make a user admin, run:");
    console.log(
      "      node scripts/manage-admins.js --make-admin <user-email>"
    );
    console.log("");
    console.log("   2. To remove admin privileges, run:");
    console.log(
      "      node scripts/manage-admins.js --remove-admin <user-email>"
    );
    console.log("");
    console.log("   3. To list all users, run:");
    console.log("      node scripts/manage-admins.js --list-users");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes("--make-admin")) {
  const emailIndex = args.indexOf("--make-admin") + 1;
  const email = args[emailIndex];

  if (!email) {
    console.error("❌ Please provide an email address");
    process.exit(1);
  }

  makeUserAdmin(email);
} else if (args.includes("--remove-admin")) {
  const emailIndex = args.indexOf("--remove-admin") + 1;
  const email = args[emailIndex];

  if (!email) {
    console.error("❌ Please provide an email address");
    process.exit(1);
  }

  removeUserAdmin(email);
} else if (args.includes("--list-users")) {
  listUsers();
} else {
  main();
}

async function makeUserAdmin(email) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isAdmin: true },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`✅ User ${email} is already an admin`);
      process.exit(0);
    }

    await db.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });

    console.log(`✅ User ${email} (${user.name || "No name"}) is now an admin`);
  } catch (error) {
    console.error("❌ Error making user admin:", error);
  } finally {
    await db.$disconnect();
  }
}

async function removeUserAdmin(email) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isAdmin: true },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    if (!user.isAdmin) {
      console.log(`✅ User ${email} is not an admin`);
      process.exit(0);
    }

    await db.user.update({
      where: { id: user.id },
      data: { isAdmin: false },
    });

    console.log(
      `✅ Admin privileges removed from ${email} (${user.name || "No name"})`
    );
  } catch (error) {
    console.error("❌ Error removing admin privileges:", error);
  } finally {
    await db.$disconnect();
  }
}

async function listUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("👥 All Users:");
    users.forEach((user, index) => {
      const adminStatus = user.isAdmin ? "🔑 ADMIN" : "👤 USER";
      console.log(
        `   ${index + 1}. ${user.email} (${
          user.name || "No name"
        }) ${adminStatus}`
      );
    });
  } catch (error) {
    console.error("❌ Error listing users:", error);
  } finally {
    await db.$disconnect();
  }
}
