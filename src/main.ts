import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
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
