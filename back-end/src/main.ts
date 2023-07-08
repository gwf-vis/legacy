import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));
  app.enableCors({
    // origin: /^(http|https):\/\/localhost*/,
    origin: /.*/,
    credentials: true,
  });
  await app.listen(5000, '0.0.0.0');
}
bootstrap();
