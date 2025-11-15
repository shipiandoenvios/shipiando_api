import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';
import { csrfMiddleware } from './common/middleware/csrf.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Parse cookies on incoming requests so guards/controllers can read req.cookies
  app.use(cookieParser());
  // Enable CORS with credentials so browser will send HttpOnly cookies
  app.enableCors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true });
  // CSRF double-submit middleware for mutating requests
  app.use(csrfMiddleware);
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
  app.enableCors();

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

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
