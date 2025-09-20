import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

// Minimal stable payload
const body = {
  title: 'E-commerce Website Development Agreement',
  projectTitle: 'E-commerce Website Development',
  projectType: 'web-development',
  projectDescription:
    'Build a modern e-commerce platform with payment integration.',
  budget: 15000,
  currency: 'USD',
  paymentStructure: 'milestone',
  durationWeeks: 12,
  startDate: '2025-01-15',
  deliverables: [
    'Responsive website',
    'Payment integration',
    'Admin dashboard',
  ],
  client_id: 1,
  project_id: 1,
  contract_value: 15000,
  end_date: '2025-04-30',
};

// Force Gemini stub path
process.env.GEMINI_API_KEY = '';

// Increase timeout (AI generation + DB) safety margin
jest.setTimeout(15000);

describe('Contracts AI Agent (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    jwt = app.get(JwtService);
    prisma = app.get(PrismaService);

    // Pick the first active user (works for both minimal and full seed modes)
    const seedUser = await prisma.users.findFirst({
      where: { active: true },
      select: { id: true, email: true, role: true },
      orderBy: { id: 'asc' },
    });
    if (!seedUser) {
      throw new Error('No users found in database for AI agent test');
    }
    token = jwt.sign({
      sub: seedUser.id,
      email: seedUser.email,
      role: seedUser.role,
    });
  });

  afterAll(async () => {
    // optional cleanup
    // No cleanup needed for seeded user
    await app.close();
  });

  it('POST /contracts/ai/generate-and-save should create a draft contract with aiMeta', async () => {
    expect(token).toBeTruthy();
    const httpServer = app.getHttpServer() as unknown as import('http').Server;
    const res = await request(httpServer)
      .post('/api/v1/contracts/ai/generate-and-save')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);
    const responseBody: unknown = res.body;
    if (
      !responseBody ||
      typeof responseBody !== 'object' ||
      Array.isArray(responseBody)
    ) {
      throw new Error('Unexpected response shape');
    }
    const draft = responseBody as {
      id?: number;
      status?: string;
      content?: string;
      aiMeta?: { aiModel?: string };
    };
    expect(draft.id).toBeDefined();
    expect(draft.status).toBe('draft');
    expect(typeof draft.content).toBe('string');
    expect(draft.aiMeta?.aiModel).toBeTruthy();
  });
});
