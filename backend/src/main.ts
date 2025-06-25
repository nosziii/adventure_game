import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthGuard } from '@nestjs/passport';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Fontos az automatikus típuskonverzióhoz
      transformOptions: {
        enableImplicitConversion: true, // Ez segít pl. string '123' -> number 123 konverziónál
      },
    }),
  );
  // --- GLOBÁLIS GUARD BEÁLLÍTÁSA ---
  // app.useGlobalGuards(new (AuthGuard('jwt'))())
  // ---------------------------------

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
