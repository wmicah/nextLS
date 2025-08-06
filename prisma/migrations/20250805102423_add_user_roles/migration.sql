-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('COACH', 'CLIENT');

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "coachId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'COACH';

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
