import type { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let server: ((request: Request, response: Response) => void) | undefined;

async function getServer() {
  if (server) return server;

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const configuredOrigin = process.env.FRONTEND_URL;
      const permitted =
        !origin ||
        origin === 'http://localhost:5173' ||
        origin === configuredOrigin ||
        /^https:\/\/droneops-nexus[\w-]*\.vercel\.app$/.test(origin);
      callback(
        permitted ? null : new Error('Origin not allowed by CORS.'),
        permitted,
      );
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  server = app.getHttpAdapter().getInstance() as (
    request: Request,
    response: Response,
  ) => void;
  return server;
}

export default async function handler(request: Request, response: Response) {
  const application = await getServer();
  application(request, response);
}
