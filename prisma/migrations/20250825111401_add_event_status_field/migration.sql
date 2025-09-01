-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "status" "public"."EventStatus" NOT NULL DEFAULT 'PENDING';
