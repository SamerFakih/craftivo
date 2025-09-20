/*
  Warnings:

  - You are about to drop the column `uuid` on the `tasks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."tasks_uuid_key";

-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "uuid";
