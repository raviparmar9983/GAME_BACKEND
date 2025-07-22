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
    origin: ['http://localhost:3000', 'http://192.168.4.51:3002'],
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
