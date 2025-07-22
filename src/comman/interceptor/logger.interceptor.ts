import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    console.info(
      `Request received at ${req.url}: ${new Date().toISOString()} `,
    );
    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          console.info(`Response Time for ${req.url} ${Date.now() - now}ms`),
        ),
      );
  }
}
