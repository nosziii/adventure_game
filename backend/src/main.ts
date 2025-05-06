import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AuthGuard } from '@nestjs/passport'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    // --- GLOBÁLIS GUARD BEÁLLÍTÁSA ---
  // app.useGlobalGuards(new (AuthGuard('jwt'))())
  // ---------------------------------

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
