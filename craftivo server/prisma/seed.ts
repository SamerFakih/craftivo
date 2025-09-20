/*
  Prisma Seed Script
  - Populates realistic data for users, teams, clients, projects, tasks, time entries, invoices, and contracts
  - Intended to run after `prisma migrate reset` on a clean database
*/

/* eslint-disable */
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Basic utility randomizers (avoid external faker dependency for portability)
const firstNames = [
  'Ava',
  'Liam',
  'Olivia',
  'Noah',
  'Emma',
  'Elijah',
  'Sophia',
  'Mia',
  'Ethan',
  'Isabella',
  'Lucas',
  'Amelia',
];
const lastNames = [
  'Nguyen',
  'Smith',
  'Johnson',
  'Garcia',
  'Brown',
  'Khan',
  'Patel',
  'Martin',
  'Lopez',
  'Silva',
  'Haddad',
  'Fakih',
];
const companyPrefixes = [
  'Acme',
  'Globex',
  'Innova',
  'NextGen',
  'Vertex',
  'Bright',
  'Prime',
  'Nimbus',
  'Aurora',
  'Zenith',
];
const companySuffixes = [
  'Labs',
  'Solutions',
  'Systems',
  'Group',
  'Studios',
  'Digital',
  'Dynamics',
  'Corp',
  'Holdings',
  'Works',
];
const projectAdjectives = [
  'Marketing',
  'Field',
  'Internal',
  'Customer',
  'Payment',
  'Analytics',
  'Mobile',
  'Platform',
  'Growth',
  'AI',
];
const projectNouns = [
  'Website',
  'Portal',
  'App',
  'Dashboard',
  'API',
  'Engine',
  'Service',
  'Workflow',
  'Console',
  'Workspace',
];
const taskVerbs = [
  'Design',
  'Implement',
  'Refactor',
  'Optimize',
  'Document',
  'Integrate',
  'Test',
  'Audit',
  'Migrate',
  'Deploy',
];
const taskObjects = [
  'auth module',
  'billing logic',
  'email queue',
  'UI components',
  'API gateway',
  'logging system',
  'notification service',
  'PDF generator',
  'contract signer',
  'report export',
];

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

interface SeedConfig {
  users: number;
  clients: number;
  projectsPerClient: [number, number];
  tasksPerProject: [number, number];
  timeEntriesPerTask: [number, number];
  invoicesPerClient: [number, number];
  contractsPerClient: [number, number];
  expensesPerProject: [number, number];
}

const FULL_CONFIG: SeedConfig = {
  users: 15,
  clients: 12,
  projectsPerClient: [1, 3],
  tasksPerProject: [5, 12],
  timeEntriesPerTask: [1, 4],
  invoicesPerClient: [1, 3],
  contractsPerClient: [1, 2],
  expensesPerProject: [2, 6],
};

async function seedMinimal() {
  console.log('Seeding database with realistic sample data (minimal)...');

  // Users
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

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
  // Generate a unique invoice number based on existing count to avoid P2002 on re-run
  const existingInvoiceCount = await prisma.invoices.count();
  const minimalInvoiceNumber = `INV-${new Date().getFullYear()}-${String(existingInvoiceCount + 1).padStart(4, '0')}`;
  await prisma.invoices.create({
    data: {
      invoice_number: minimalInvoiceNumber,
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

  console.log('Minimal seed completed.');
}

async function seedFull() {
  console.log('Seeding FULL dataset (large realistic data)...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const users: { id: number; email: string }[] = [];
  for (let i = 0; i < FULL_CONFIG.users; i++) {
    const first = rand(firstNames);
    const last = rand(lastNames);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: first,
        last_name: last,
        role: i === 0 ? 'freelancer' : 'team_member',
        hourly_rate: new Prisma.Decimal((40 + randInt(0, 70)).toFixed(2)),
        location: 'Remote',
      },
      select: { id: true, email: true },
    });
    users.push(user);
  }
  const ownerId = users[0].id;

  // 2. Team + members
  await prisma.teams.create({
    data: {
      name: 'Core Team',
      description: 'Autogenerated core team',
      owner_id: ownerId,
      slug: 'core-team',
      team_members: {
        create: users.slice(0, 8).map((u, idx) => ({
          user_id: u.id,
          role: idx === 0 ? 'owner' : idx < 2 ? 'admin' : 'member',
          permissions: {},
        })),
      },
    },
  });

  // 3. Clients
  const clients: { id: number; name: string }[] = [];
  for (let i = 0; i < FULL_CONFIG.clients; i++) {
    const name = `${rand(companyPrefixes)} ${rand(companySuffixes)}`;
    const client = await prisma.clients.create({
      data: {
        name,
        email: `contact+${i}@${name.split(' ')[0].toLowerCase()}.com`,
        company: name,
        created_by: ownerId,
        address: `${randInt(10, 999)} Market Street`,
      },
      select: { id: true, name: true },
    });
    clients.push(client);
  }

  // 4. Projects + members + tags
  const projects: { id: number; client_id: number | null; name: string }[] = [];
  for (const client of clients) {
    const projectCount = randInt(
      FULL_CONFIG.projectsPerClient[0],
      FULL_CONFIG.projectsPerClient[1],
    );
    for (let p = 0; p < projectCount; p++) {
      const name = `${rand(projectAdjectives)} ${rand(projectNouns)}`;
      const project = await prisma.projects.create({
        data: {
          name,
          description: `Project ${name} for ${client.name}`,
          client_id: client.id,
          owner_id: ownerId,
          status: 'active',
          priority: rand(['low', 'medium', 'high']),
          start_date: new Date(Date.now() - randInt(1, 40) * 24 * 3600 * 1000),
          budget: new Prisma.Decimal(randInt(5000, 60000).toFixed(2)),
          currency: 'USD',
          billing_type: rand(['hourly', 'fixed', 'milestone']),
          project_members: {
            create: users.slice(0, randInt(3, 6)).map((u, idx) => ({
              user_id: u.id,
              role: idx === 0 ? 'owner' : idx === 1 ? 'manager' : 'member',
              permissions: {},
            })),
          },
          project_tags: {
            create: [
              { tag_name: rand(['core', 'v1', 'client-facing', 'internal']) },
              { tag_name: rand(['api', 'ui', 'ops', 'qa']) },
            ],
          },
        },
        select: { id: true, client_id: true, name: true },
      });
      projects.push(project);
    }
  }

  // 5. Tasks (per project)
  // We only create tasks with a non-null project_id; cast to non-null for later use
  const tasks: { id: number; project_id: number }[] = [];
  for (const project of projects) {
    const tCount = randInt(
      FULL_CONFIG.tasksPerProject[0],
      FULL_CONFIG.tasksPerProject[1],
    );
    for (let t = 0; t < tCount; t++) {
      const title = `${rand(taskVerbs)} ${rand(taskObjects)}`;
      const assigned = rand(users).id;
      const created = rand(users).id;
      const taskRec = await prisma.tasks.create({
        data: {
          title,
          description: `${title} detailed implementation notes...`,
          project_id: project.id,
          assigned_to: assigned,
          created_by: created,
          status: rand(['pending', 'in_progress', 'completed']),
          priority: rand(['low', 'medium', 'high']),
          estimated_hours: new Prisma.Decimal(randInt(1, 20).toFixed(2)),
          completed_at:
            Math.random() > 0.6
              ? new Date(Date.now() - randInt(1, 10) * 86400000)
              : null,
        },
        select: { id: true, project_id: true },
      });
      tasks.push({ id: taskRec.id, project_id: taskRec.project_id as number });
    }
  }

  // 6. Time entries (per task)
  let timeEntryTotal = 0;
  for (const task of tasks) {
    const teCount = randInt(
      FULL_CONFIG.timeEntriesPerTask[0],
      FULL_CONFIG.timeEntriesPerTask[1],
    );
    for (let i = 0; i < teCount; i++) {
      const user = rand(users);
      const start = new Date(Date.now() - randInt(1, 25) * 3600 * 1000);
      const durationSec = randInt(1800, 4 * 3600);
      await prisma.time_entries.create({
        data: {
          user_id: user.id,
          project_id: task.project_id,
          task_id: task.id,
          start_time: start,
          end_time: new Date(start.getTime() + durationSec * 1000),
          duration: durationSec,
          description: 'Worked on ' + rand(['logic', 'UI', 'tests', 'docs']),
          hourly_rate: new Prisma.Decimal((40 + randInt(0, 60)).toFixed(2)),
          amount: new Prisma.Decimal(
            ((durationSec / 3600) * (40 + randInt(0, 60))).toFixed(2),
          ),
          status: 'logged',
        },
      });
      timeEntryTotal++;
    }
  }

  // 7. Invoices
  // Start invoice counter AFTER any existing invoices (e.g., from minimal seed re-run)
  let invoiceCounter = (await prisma.invoices.count()) + 1;
  for (const client of clients) {
    const invCount = randInt(
      FULL_CONFIG.invoicesPerClient[0],
      FULL_CONFIG.invoicesPerClient[1],
    );
    for (let ii = 0; ii < invCount; ii++) {
      const project = rand(projects.filter((p) => p.client_id === client.id));
      const invoice = await prisma.invoices.create({
        data: {
          invoice_number: `INV-${new Date().getFullYear()}-${String(invoiceCounter).padStart(4, '0')}`,
          client_id: client.id,
          project_id: project?.id,
          user_id: ownerId,
          issue_date: new Date(Date.now() - randInt(0, 20) * 86400000),
          due_date: new Date(Date.now() + randInt(5, 25) * 86400000),
          status: rand(['draft', 'sent', 'paid', 'pending']),
          subtotal: new Prisma.Decimal(randInt(200, 5000).toFixed(2)),
          tax_rate: new Prisma.Decimal('0.00'),
          tax_amount: new Prisma.Decimal('0.00'),
          total_amount: new Prisma.Decimal(randInt(200, 5000).toFixed(2)),
          currency: 'USD',
          notes: 'Auto-generated invoice',
        },
        select: { id: true },
      });
      invoiceCounter++;
      // Add line item(s)
      await prisma.invoice_items.create({
        data: {
          invoice_id: invoice.id,
          description: 'Professional services',
          quantity: new Prisma.Decimal('1.00'),
          unit_price: new Prisma.Decimal(randInt(200, 3000).toFixed(2)),
          total_amount: new Prisma.Decimal(randInt(200, 3000).toFixed(2)),
          billable_type: 'time',
        },
      });
    }
  }

  // 8. Contract templates & contracts with versions + audit logs
  const template = await prisma.contract_templates.create({
    data: {
      name: 'Master Services Agreement',
      description: 'Reusable MSA template',
      content:
        'Base template with variables {{client}} {{freelancer}} {{scope}}',
      category: 'general',
      is_default: true,
      created_by: ownerId,
      variables: { items: ['client', 'freelancer', 'scope'] },
    },
    select: { id: true },
  });

  for (const client of clients) {
    const count = randInt(
      FULL_CONFIG.contractsPerClient[0],
      FULL_CONFIG.contractsPerClient[1],
    );
    for (let c = 0; c < count; c++) {
      const project = rand(projects.filter((p) => p.client_id === client.id));
      const contract = await prisma.contracts.create({
        data: {
          title: `${client.name} Engagement ${c + 1}`,
          client_id: client.id,
          project_id: project?.id,
          template_id: template.id,
          user_id: ownerId,
          content: `Statement of work for ${client.name}. Phase ${c + 1}.`,
          status: rand(['draft', 'sent', 'signed']),
          contract_value: new Prisma.Decimal(randInt(5000, 40000).toFixed(2)),
          currency: 'USD',
          start_date: new Date(Date.now() - randInt(0, 15) * 86400000),
          end_date: new Date(Date.now() + randInt(30, 120) * 86400000),
        },
        select: { id: true },
      });

      // Versions
      const versionCount = randInt(1, 3);
      for (let v = 1; v <= versionCount; v++) {
        const ver = await (prisma as any).contract_versions.create({
          data: {
            contract_id: contract.id,
            version_number: v,
            content: `Version ${v} content for contract ${contract.id}`,
            generated_by: v === 1 ? 'manual' : 'regenerate',
          },
        });
        if (v === versionCount) {
          // Set current version via relation connect for better type safety
          await prisma.contracts.update({
            where: { id: contract.id },
            data: { current_version_id: ver.id } as any,
          });
        }
      }

      // Audit logs
      await (prisma as any).contract_audit_logs.createMany({
        data: [
          { contract_id: contract.id, action: 'create' },
          { contract_id: contract.id, action: 'update' },
          {
            contract_id: contract.id,
            action: 'status_change',
            details: { to: 'sent' } as any,
          },
        ],
      });
    }
  }

  // 9. Expenses
  for (const project of projects) {
    const expCount = randInt(
      FULL_CONFIG.expensesPerProject[0],
      FULL_CONFIG.expensesPerProject[1],
    );
    for (let i = 0; i < expCount; i++) {
      await prisma.expenses.create({
        data: {
          user_id: ownerId,
          project_id: project.id,
          client_id: project.client_id ?? undefined,
          description: rand([
            'Cloud hosting',
            'Design assets',
            'SaaS license',
            'QA tools',
            'Test devices',
          ]),
          amount: new Prisma.Decimal(
            randInt(10, 500).toFixed(2),
          ) as unknown as number,
          currency: 'USD',
          category: rand(['Software', 'Assets', 'Services']),
          expense_date: new Date(Date.now() - randInt(0, 20) * 86400000),
          billable: Math.random() > 0.4,
          invoiced: Math.random() > 0.7,
        },
      });
    }
  }

  // 10. Email templates & logs
  const tmpl = await prisma.email_templates.create({
    data: {
      name: 'Generic Notification',
      subject: 'System Update',
      content: '<p>Hello {{name}}, system updated.</p>',
      type: 'general',
      created_by: ownerId,
      is_default: true,
    },
    select: { id: true },
  });
  await prisma.email_logs.createMany({
    data: clients.slice(0, 5).map((c) => ({
      recipient_email: `team@${c.name.split(' ')[0].toLowerCase()}.com`,
      subject: 'Welcome',
      content: 'Welcome to the platform',
      template_id: tmpl.id,
      status: 'sent',
      sent_at: new Date(),
    })),
  });

  // 11. User settings
  await prisma.user_settings.createMany({
    data: users.slice(0, 5).map((u, idx) => ({
      user_id: u.id,
      key: 'theme',
      value:
        idx % 2 === 0
          ? ('{"mode":"dark"}' as any)
          : ('{"mode":"light"}' as any),
    })),
  });

  // 12. Activity logs
  await prisma.activity_logs.createMany({
    data: Array.from({ length: 25 }).map(() => ({
      user_id: rand(users).id,
      action: rand([
        'update_project',
        'create_task',
        'log_time',
        'send_invoice',
      ]),
      entity_type: rand(['project', 'task', 'invoice']),
      entity_id: randInt(1, 50),
      created_at: new Date(Date.now() - randInt(0, 72) * 3600 * 1000),
    })),
  });

  console.log('Full seed completed.');
  console.log('Summary:', {
    users: users.length,
    clients: clients.length,
    projects: projects.length,
    tasks: tasks.length,
    time_entries: timeEntryTotal,
  });
}

async function main() {
  const rawMode = process.env.SEED_MODE || '';
  const mode = rawMode.toLowerCase().trim() === 'full' ? 'full' : 'minimal';
  console.log('Detected SEED_MODE raw:', rawMode, 'resolved:', mode);
  if (mode === 'full') {
    await seedFull();
  } else {
    await seedMinimal();
  }
  console.log(`Seed mode: ${mode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
