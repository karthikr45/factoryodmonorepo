import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { initSentry } from './common/observability/sentry';

async function bootstrap(): Promise<void> {
  await initSentry();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });

  // Security headers
  app.use(helmet());

  // Capture the raw request body for /api/billing/webhook so we can verify
  // Razorpay's HMAC signature against the exact bytes they sent. The default
  // body parser still applies; we just stash the buffer on req.rawBody.
  app.use(
    json({
      verify: (req: unknown, _res: unknown, buf: Buffer) => {
        (req as Record<string, unknown>).rawBody = Buffer.from(buf);
      },
    }),
  );

  // CORS
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception + response wrappers
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global /api prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Swagger OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FactoryOS API')
    .setDescription('Manufacturing operations + finance backend')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.info(`FactoryOS API listening on http://localhost:${port}`);
  console.info(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
