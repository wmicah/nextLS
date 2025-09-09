import { PrismaClient } from "../../generated/prisma"

declare global {
  var cachedPrisma: PrismaClient
}

let prisma: PrismaClient

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal',
  })
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  }
  prisma = global.cachedPrisma
}

// Add connection error handling
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error)
})

export const db = prisma
