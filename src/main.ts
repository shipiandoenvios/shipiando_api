import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser = require('cookie-parser');
import { csrfMiddleware } from './common/middleware/csrf.middleware';
import { AppLogger } from './common/logging/logger';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor';
import * as express from 'express';
import tenantMiddleware from './common/middleware/tenant.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cookieParserMiddleware = cookieParser();
  app.use(cookieParserMiddleware);
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.use(csrfMiddleware);
  app.use(tenantMiddleware);

  app.use(
    '/api/webhook/:carrier',
    express.raw({ type: '*/*', limit: '512kb' }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Shipiando API')
    .setDescription('API de logística, envíos, inventario y tracking')
    .setVersion('1.0.0')
    .addTag('user')
    .addTag('client-user')
    .addTag('client')
    .addTag('address')
    .addTag('product')
    .addTag('product-category')
    .addTag('inventory')
    .addTag('order')
    .addTag('invoice')
    .addTag('package')
    .addTag('shipment')
    .addTag('tracking-event')
    .addTag('warehouse')
    .addTag('vehicle')
    .addTag('carrier')
    .addTag('role')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const expressApp = (app.getHttpAdapter as any)().getInstance?.() || (app as any).getHttpServer?.();
  if (expressApp && expressApp.get) {
    expressApp.get('/api-json', (_req: any, res: any) => res.json(document));
    expressApp.get('/api/api-json', (_req: any, res: any) => res.json(document));
  }

  app.useLogger(new AppLogger());
  app.useGlobalInterceptors(new IdempotencyInterceptor());

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
