import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function promoteToAdmin(email: string) {
  try {
    console.log(`Promoting user ${email} to admin...`);

    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
      },
    });

    console.log(`✅ Successfully promoted user to admin:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || "N/A"}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Admin: ${user.isAdmin}`);
  } catch (error) {
    console.error("❌ Error promoting user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: npx tsx scripts/promote-admin.ts <email>");
  console.log(
    "This will promote the user to admin status while keeping their existing role"
  );
  process.exit(1);
}

promoteToAdmin(email);
