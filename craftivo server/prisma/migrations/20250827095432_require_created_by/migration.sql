/*
  Warnings:

  - Made the column `created_by` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."clients" ALTER COLUMN "created_by" SET NOT NULL;
