import { PrismaClient } from "../../generated/prisma";

declare global {
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;

// Connection pool configuration
const prismaConfig = {
  log:
    process.env.NODE_ENV === "production"
      ? ["error"]
      : ["query", "error", "warn"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

// Add connection pool settings via connection string
// These settings help prevent connection exhaustion and timeouts
const connectionUrl = process.env.DATABASE_URL || "";
const enhancedConnectionUrl = connectionUrl.includes("?")
  ? connectionUrl
  : `${connectionUrl}?connection_limit=10&pool_timeout=20&connect_timeout=10`;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    ...prismaConfig,
    datasources: {
      db: {
        url: enhancedConnectionUrl,
      },
    },
  });
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      ...prismaConfig,
      datasources: {
        db: {
          url: enhancedConnectionUrl,
        },
      },
    });
  }
  prisma = global.cachedPrisma;
}

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log("Shutting down database connections...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", async error => {
  console.error("Uncaught exception:", error);
  await prisma.$disconnect();
  process.exit(1);
});

export const db = prisma;
