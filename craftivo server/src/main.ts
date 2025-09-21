import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

// Helper to listen with a dev-friendly fallback if the desired port is busy
import type { INestApplication } from '@nestjs/common';

async function listenWithFallback(
  app: INestApplication,
  preferredPort: number,
): Promise<number> {
  const env = process.env.NODE_ENV || 'development';
  const maxAttempts = env === 'production' ? 1 : 5; // Only try alternate ports in non-production
  let attempt = 0;
  let port = preferredPort;

  while (attempt < maxAttempts) {
    try {
      await app.listen(port);
      return port;
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error?.code === 'EADDRINUSE' && env !== 'production') {
        // Try the next port in dev/test environments
        console.warn(`Port ${port} is in use. Trying ${port + 1}...`);
        port += 1;
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
  throw new Error(
    `Unable to bind to a free port starting at ${preferredPort} after ${maxAttempts} attempt(s).`,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(requestIdMiddleware);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  app.enableCors({
    origin: frontendUrl,
    credentials: true, // Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Craftivo API')
    .setDescription('The Craftivo freelancer management platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Disable caching
  app.use((_, res: import('express').Response, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  const preferredPort = parseInt(process.env.PORT || '3000', 10);
  const boundPort = await listenWithFallback(app, preferredPort);
  console.log(`🚀 Craftivo API is running on: http://localhost:${boundPort}`);
  console.log(`📚 Swagger documentation: http://localhost:${boundPort}/api`);
}
void bootstrap();
