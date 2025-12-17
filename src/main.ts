import { LoggerInterceptor } from './comman/interceptor/logger.interceptor';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionHandler } from './comman/filters/exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      'http://localhost:3000', // local dev
      'http://192.168.227.113:3000',
      'http://192.168.164.113:3000',
      'http://192.168.1.39:3000', // your LAN frontend
      ' http://172.27.208.1:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port: number = configService.get('PORT') || 8080;
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ExceptionHandler());
  await app.listen(port, () => {
    console.info(`Server started on http://localhost:${port}`);
  });
}
bootstrap();
