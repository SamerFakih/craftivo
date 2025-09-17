/*
  Prisma Seed Script
  - Populates realistic data for users, teams, clients, projects, tasks, time entries, invoices, and contracts
  - Intended to run after `prisma migrate reset` on a clean database
*/

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic sample data...');

  // Users
  const password = 'password123';
  const passwordHash = bcrypt.hashSync(password, 10);

  const owner = await prisma.users.create({
    data: {
      email: 'owner@example.com',
      password_hash: passwordHash,
      first_name: 'Ava',
      last_name: 'Nguyen',
      role: 'freelancer',
      hourly_rate: new Prisma.Decimal('85.00'),
      location: 'Remote',
      business_name: 'Craftivo Studio',
    },
  });

  const member1 = await prisma.users.create({
    data: {
      email: 'sam.dev@example.com',
      password_hash: passwordHash,
      first_name: 'Sam',
      last_name: 'Devon',
      role: 'team_member',
      hourly_rate: new Prisma.Decimal('60.00'),
      location: 'NY, USA',
    },
  });

  const member2 = await prisma.users.create({
    data: {
      email: 'lina.qa@example.com',
      password_hash: passwordHash,
      first_name: 'Lina',
      last_name: 'Khan',
      role: 'team_member',
      hourly_rate: new Prisma.Decimal('45.00'),
      location: 'Toronto, CA',
    },
  });

  // Team
  await prisma.teams.create({
    data: {
      name: 'Product Team',
      description: 'Core product delivery team',
      owner_id: owner.id,
      slug: 'product-team',
      settings: {},
      team_members: {
        create: [
          { user_id: owner.id, role: 'owner', permissions: {} },
          { user_id: member1.id, role: 'admin', permissions: {} },
          { user_id: member2.id, role: 'member', permissions: {} },
        ],
      },
    },
  });

  // Clients
  const acme = await prisma.clients.create({
    data: {
      name: 'Acme Corp',
      email: 'finance@acme.com',
      company: 'Acme Corporation',
      created_by: owner.id,
      address: '100 Main St, Springfield',
    },
  });

  const globex = await prisma.clients.create({
    data: {
      name: 'Globex Inc',
      email: 'ops@globex.com',
      company: 'Globex Incorporated',
      created_by: owner.id,
      address: '88 Queen St, Toronto',
    },
  });

  // Projects
  const websiteProject = await prisma.projects.create({
    data: {
      name: 'Acme Marketing Website',
      description: 'Revamp corporate marketing site with blog and CMS',
      client_id: acme.id,
      owner_id: owner.id,
      status: 'active',
      priority: 'high',
      start_date: new Date(),
      budget: new Prisma.Decimal('15000.00'),
      currency: 'USD',
      billing_type: 'hourly',
      project_members: {
        create: [
          { user_id: member1.id, role: 'manager', permissions: {} },
          { user_id: member2.id, role: 'member', permissions: {} },
        ],
      },
    },
  });

  const mobileApp = await prisma.projects.create({
    data: {
      name: 'Globex Field App',
      description: 'Cross-platform app for field technicians',
      client_id: globex.id,
      owner_id: owner.id,
      status: 'active',
      priority: 'medium',
      start_date: new Date(),
      budget: new Prisma.Decimal('40000.00'),
      currency: 'USD',
      billing_type: 'milestone',
      project_members: {
        create: [{ user_id: member1.id, role: 'member', permissions: {} }],
      },
    },
  });

  // Tasks
  const task1 = await prisma.tasks.create({
    data: {
      title: 'Build hero section',
      description: 'Responsive hero with CTA and animation',
      project_id: websiteProject.id,
      assigned_to: member1.id,
      created_by: owner.id,
      status: 'in_progress',
      priority: 'high',
      estimated_hours: new Prisma.Decimal('8.0'),
      due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    },
  });

  const task2 = await prisma.tasks.create({
    data: {
      title: 'Accessibility audit',
      description: 'Ensure WCAG 2.1 AA compliance',
      project_id: websiteProject.id,
      assigned_to: member2.id,
      created_by: owner.id,
      status: 'completed',
      priority: 'medium',
      estimated_hours: new Prisma.Decimal('5.0'),
      completed_at: new Date(),
    },
  });

  await prisma.tasks.create({
    data: {
      title: 'Offline sync module',
      description: 'Design sync strategy for poor connectivity',
      project_id: mobileApp.id,
      assigned_to: member1.id,
      created_by: owner.id,
      status: 'pending',
      priority: 'high',
      estimated_hours: new Prisma.Decimal('16.0'),
    },
  });

  // Time Entries (this month)
  const startOfMonth = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
  );

  const te1 = await prisma.time_entries.create({
    data: {
      user_id: member1.id,
      project_id: websiteProject.id,
      task_id: task1.id,
      start_time: new Date(startOfMonth.getTime() + 2 * 3600 * 1000),
      end_time: new Date(startOfMonth.getTime() + 6 * 3600 * 1000),
      duration: 4 * 3600,
      description: 'Initial layout and styles',
      hourly_rate: new Prisma.Decimal('60.00'),
      amount: new Prisma.Decimal('240.00'),
      status: 'logged',
    },
  });

  await prisma.time_entries.create({
    data: {
      user_id: member2.id,
      project_id: websiteProject.id,
      task_id: task2.id,
      start_time: new Date(startOfMonth.getTime() + 24 * 3600 * 1000),
      end_time: new Date(startOfMonth.getTime() + 27 * 3600 * 1000),
      duration: 3 * 3600,
      description: 'Contrast and keyboard nav fixes',
      hourly_rate: new Prisma.Decimal('45.00'),
      amount: new Prisma.Decimal('135.00'),
      status: 'logged',
    },
  });

  // Invoice
  await prisma.invoices.create({
    data: {
      invoice_number: 'INV-2025-0001',
      client_id: acme.id,
      project_id: websiteProject.id,
      user_id: owner.id,
      issue_date: new Date(),
      due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      status: 'sent',
      subtotal: new Prisma.Decimal('375.00'),
      tax_rate: new Prisma.Decimal('0.00'),
      tax_amount: new Prisma.Decimal('0.00'),
      total_amount: new Prisma.Decimal('375.00'),
      currency: 'USD',
      notes: 'Thank you for your business!',
      invoice_items: {
        create: [
          {
            description: 'Development time',
            quantity: new Prisma.Decimal('1.00'),
            unit_price: new Prisma.Decimal('375.00'),
            total_amount: new Prisma.Decimal('375.00'),
            billable_type: 'time',
            reference_id: te1.id,
          },
        ],
      },
    },
  });

  // Contract Template and Contract
  const template = await prisma.contract_templates.create({
    data: {
      name: 'Standard Services Agreement',
      description: 'General-purpose contract for client services',
      content:
        'This Services Agreement is made between {{freelancer}} and {{client}}... [template]...',
      category: 'general',
      is_default: true,
      created_by: owner.id,
      variables: { fields: ['freelancer', 'client', 'rate', 'scope'] },
    },
  });

  await prisma.contracts.create({
    data: {
      title: 'Acme Website Agreement',
      client_id: acme.id,
      project_id: websiteProject.id,
      template_id: template.id,
      user_id: owner.id,
      content:
        'Agreement between Craftivo Studio and Acme Corp for website redesign. Scope includes design, development, and deployment.',
      status: 'draft',
      contract_value: new Prisma.Decimal('15000.00'),
      currency: 'USD',
      start_date: new Date(),
      end_date: new Date(Date.now() + 60 * 24 * 3600 * 1000),
    },
  });

  // Expenses
  await prisma.expenses.createMany({
    data: [
      {
        user_id: owner.id,
        project_id: websiteProject.id,
        client_id: acme.id,
        description: 'Stock images',
        amount: new Prisma.Decimal('49.00') as unknown as number,
        currency: 'USD',
        category: 'Assets',
        expense_date: new Date(),
        billable: true,
        invoiced: false,
      },
      {
        user_id: owner.id,
        project_id: mobileApp.id,
        client_id: globex.id,
        description: 'Prototype tool subscription',
        amount: new Prisma.Decimal('19.00') as unknown as number,
        currency: 'USD',
        category: 'Software',
        expense_date: new Date(),
        billable: false,
        invoiced: false,
      },
    ],
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
