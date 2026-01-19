import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { idempotencyService } from './idempotency.service';

interface RequestWithIdempotency {
  method?: string;
  headers?: {
    'idempotency-key'?: string;
    'Idempotency-Key'?: string;
    'Idempotency-key'?: string;
  };
}

interface ResponseWithStatus {
  statusCode?: number;
  status: (code: number) => ResponseWithStatus;
  json: (body: unknown) => ResponseWithStatus;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<RequestWithIdempotency>();
    const res = ctx.getResponse<ResponseWithStatus>();
    const method = req.method?.toUpperCase() || 'GET';

    // Only act for mutating methods and when header is present
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
      return next.handle();
    const key =
      req.headers?.['idempotency-key'] ||
      req.headers?.['Idempotency-Key'] ||
      req.headers?.['Idempotency-key'];
    if (!key) return next.handle();

    // If we have a completed response, return it immediately
    const stored = idempotencyService.get(key);
    if (stored) {
      res.status(stored.statusCode).json(stored.body);
      return of(null);
    }

    // If currently processing, return 202 to indicate in-flight
    if (idempotencyService.isProcessing(key)) {
      res
        .status(202)
        .json({ success: false, message: 'Request already in progress' });
      return of(null);
    }

    // Mark as processing and invoke handler
    const started = idempotencyService.startProcessing(key);
    if (!started) {
      res.status(202).json({
        success: false,
        message: 'Request already in progress or completed',
      });
      return of(null);
    }

    return next.handle().pipe(
      switchMap((result: unknown) => {
        try {
          // capture final output and status
          const statusCode = res?.statusCode || 200;
          idempotencyService.complete(
            key,
            statusCode,
            result === undefined ? null : result,
          );
        } catch {
          // Non-fatal
        }
        return of(result);
      }),
    );
  }
}
