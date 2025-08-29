-- CreateEnum
CREATE TYPE "public"."TimeEntryStatus" AS ENUM ('running', 'paused', 'logged', 'billed');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."BillableType" AS ENUM ('service', 'product', 'expense', 'time');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('draft', 'sent', 'signed', 'executed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "public"."ProjectMemberRole" AS ENUM ('owner', 'manager', 'member');

-- CreateEnum
CREATE TYPE "public"."EmailTemplateType" AS ENUM ('general', 'invoice', 'reminder', 'welcome', 'contract');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

-- CreateTable
CREATE TABLE "public"."time_entries" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_id" INTEGER,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "hourly_rate" DECIMAL(10,2),
    "amount" DECIMAL(10,2),
    "status" "public"."TimeEntryStatus" NOT NULL DEFAULT 'logged',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_id" INTEGER,
    "project_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_method" TEXT,
    "payment_terms" TEXT,
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_items" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "billable_type" "public"."BillableType" NOT NULL DEFAULT 'service',
    "reference_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client_id" INTEGER,
    "project_id" INTEGER,
    "template_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'draft',
    "contract_value" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "signed_date" TIMESTAMP(3),
    "signed_by_client" TEXT,
    "signed_by_freelancer" TEXT,
    "signature_client" TEXT,
    "signature_freelancer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_templates" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "variables" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" INTEGER NOT NULL,
    "slug" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_members" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'member',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "hourly_rate" DECIMAL(10,2),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_members" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "public"."ProjectMemberRole" NOT NULL DEFAULT 'member',
    "hourly_rate" DECIMAL(10,2),
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_tags" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "tag_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_tags" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "tag_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_comments" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "content" TEXT NOT NULL,
    "parent_id" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_attachments" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "uploaded_by" INTEGER,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_attachments" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "uploaded_by" INTEGER,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."EmailTemplateType" NOT NULL DEFAULT 'general',
    "variables" JSONB,
    "created_by" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_logs" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" INTEGER,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "template_id" INTEGER,
    "reference_type" TEXT,
    "reference_id" INTEGER,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenses" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "client_id" INTEGER,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_path" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoice_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_entries_uuid_key" ON "public"."time_entries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_uuid_key" ON "public"."invoices"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "public"."invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_uuid_key" ON "public"."contracts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "contract_templates_uuid_key" ON "public"."contract_templates"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "teams_uuid_key" ON "public"."teams"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "public"."teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "public"."team_members"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "public"."project_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_tags_project_id_tag_name_key" ON "public"."project_tags"("project_id", "tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "task_tags_task_id_tag_name_key" ON "public"."task_tags"("task_id", "tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "task_comments_uuid_key" ON "public"."task_comments"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "task_attachments_uuid_key" ON "public"."task_attachments"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "project_attachments_uuid_key" ON "public"."project_attachments"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key_key" ON "public"."user_settings"("user_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_uuid_key" ON "public"."email_templates"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_uuid_key" ON "public"."email_logs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_uuid_key" ON "public"."activity_logs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_uuid_key" ON "public"."expenses"("uuid");

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "public"."time_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_templates" ADD CONSTRAINT "contract_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_tags" ADD CONSTRAINT "project_tags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_tags" ADD CONSTRAINT "task_tags_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_comments" ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_comments" ADD CONSTRAINT "task_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_attachments" ADD CONSTRAINT "project_attachments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_attachments" ADD CONSTRAINT "project_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_templates" ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
