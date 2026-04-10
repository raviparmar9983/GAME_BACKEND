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
      'https://www.crazygames.com',
      'https://games.crazygames.com',
      'http://192.168.1.82:5173',
      'http://localhost:5173',
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
