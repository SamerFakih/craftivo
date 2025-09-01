-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('active', 'completed', 'paused', 'review', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ProjectPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "public"."BillingType" AS ENUM ('hourly', 'fixed', 'milestone');

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client_id" INTEGER,
    "owner_id" INTEGER NOT NULL,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'active',
    "priority" "public"."ProjectPriority" NOT NULL DEFAULT 'medium',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_type" "public"."BillingType" NOT NULL DEFAULT 'hourly',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_uuid_key" ON "public"."projects"("uuid");

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
