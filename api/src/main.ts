import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS — allow frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://graphit-up.vercel.app',
      /\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 graphitUp API running on http://localhost:${port}`);
  logger.log(`📡 WebSocket available at ws://localhost:${port}/scan`);
  logger.log(`❤️  Health check: http://localhost:${port}/health`);
}
bootstrap();
