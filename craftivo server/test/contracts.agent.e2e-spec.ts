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

// Stub Gemini via env by ensuring no API key set → service uses stub
process.env.GEMINI_API_KEY = '';
process.env.JWT_SECRET = 'test-secret';

describe('Contracts AI Agent (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    jwt = app.get(JwtService);
    prisma = app.get(PrismaService);

    // Seed or update a user to satisfy JwtStrategy validate
    await prisma.users.upsert({
      where: { email: 'tester@example.com' },
      update: { active: true },
      create: {
        email: 'tester@example.com',
        password_hash: 'x',
        first_name: 'Test',
        last_name: 'User',
        active: true,
      },
    });
  });

  afterAll(async () => {
    // optional cleanup
    await prisma.users.deleteMany({ where: { email: 'tester@example.com' } });
    await app.close();
  });

  it('POST /contracts/ai/generate-and-save should create a draft contract with aiMeta', async () => {
    const user = await prisma.users.findFirst({
      where: { email: 'tester@example.com' },
    });
    expect(user).toBeTruthy();

    const token = jwt.sign({
      sub: user?.id,
      email: user?.email,
      role: user?.role || 'freelancer',
    });

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
