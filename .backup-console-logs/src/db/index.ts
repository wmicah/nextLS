import { PrismaClient } from "../../generated/prisma";

declare global {
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;

// For production (Vercel), use the DATABASE_URL as-is (it should already have pgbouncer=true)
// For development, add connection pool settings if not present
const connectionUrl = process.env.DATABASE_URL || "";
const isPgBouncer = connectionUrl.includes("pgbouncer=true");

// Only add connection settings if not using pgbouncer
const enhancedConnectionUrl = isPgBouncer
  ? connectionUrl // Use as-is for pgbouncer (Vercel)
  : connectionUrl.includes("?")
  ? connectionUrl
  : `${connectionUrl}?connection_limit=20&pool_timeout=30&connect_timeout=15`;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: enhancedConnectionUrl,
      },
    },
  });
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      log: ["error", "warn"],
      datasources: {
        db: {
          url: enhancedConnectionUrl,
        },
      },
    });
  }
  prisma = global.cachedPrisma;
}

// Only add graceful shutdown in production
// In development, Next.js handles this and we don't want to disconnect prematurely
if (process.env.NODE_ENV === "production") {
  const gracefulShutdown = async () => {
    console.log("Shutting down database connections...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

export const db = prisma;
