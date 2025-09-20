/*
  Warnings:

  - A unique constraint covering the columns `[current_version_id]` on the table `contracts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."contracts" ADD COLUMN     "current_version_id" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "last_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."contract_versions" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_audit_logs" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_sign_tokens" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER,

    CONSTRAINT "contract_sign_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_versions_contract_id_version_number_key" ON "public"."contract_versions"("contract_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "contract_sign_tokens_token_key" ON "public"."contract_sign_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_current_version_id_key" ON "public"."contracts"("current_version_id");

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "public"."contract_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_audit_logs" ADD CONSTRAINT "contract_audit_logs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_audit_logs" ADD CONSTRAINT "contract_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_sign_tokens" ADD CONSTRAINT "contract_sign_tokens_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_sign_tokens" ADD CONSTRAINT "contract_sign_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
