import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: allowedOrigin,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3100);
}
void bootstrap();

function allowedOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) {
  const configuredOrigin = process.env.FRONTEND_URL;
  const permitted =
    !origin ||
    origin === 'http://localhost:5173' ||
    origin === 'http://localhost:8081' ||
    origin === 'http://localhost:19006' ||
    origin === configuredOrigin ||
    /^https:\/\/droneops-nexus[\w-]*\.vercel\.app$/.test(origin);
  callback(
    permitted ? null : new Error('Origin not allowed by CORS.'),
    permitted,
  );
}
