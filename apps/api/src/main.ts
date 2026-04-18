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

  // CORS must be enabled at create() time so the framework handles OPTIONS
  // preflight BEFORE guards run. When CORS was configured via enableCors()
  // after create({ cors: false }), OPTIONS requests reached JwtGuard and
  // got rejected with 401 — blocking every browser-initiated POST/PATCH.
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    },
  });

  app.use(helmet());

  app.use(
    json({
      verify: (req: unknown, _res: unknown, buf: Buffer) => {
        (req as Record<string, unknown>).rawBody = Buffer.from(buf);
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix('api', { exclude: ['health'] });

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
