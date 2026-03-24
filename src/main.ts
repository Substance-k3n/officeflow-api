import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173', 'http://localhost:3001'], // Vite and Next.js dev servers
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('OfficeFlow API')
    .setDescription('OfficeFlow backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const parsedPort = parseInt(process.env.PORT || '3000', 10);
  const port = Number.isNaN(parsedPort) ? 3000 : parsedPort;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📄 Swagger documentation is available at: http://localhost:${port}/api/docs`);
}

bootstrap();