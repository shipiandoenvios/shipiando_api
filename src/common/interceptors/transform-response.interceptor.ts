import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response, Request } from 'express';
import {
  META_COLLECTION_KEY,
  META_RESPONSE_MESSAGE,
} from '../decorators/response.decorator';

@Injectable()
export class TransformResponseInterceptor<T extends object>
  implements NestInterceptor<T, unknown>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const handler = context.getHandler();
    const controller = context.getClass();

    const message =
      this.reflector.get<string>(META_RESPONSE_MESSAGE, handler) ??
      this.reflector.get<string>(META_RESPONSE_MESSAGE, controller) ??
      'Operación exitosa';

    const collectionKey =
      this.reflector.get<string>(META_COLLECTION_KEY, handler) ??
      this.reflector.get<string>(META_COLLECTION_KEY, controller) ??
      'items';

    type LegacyMeta = {
      total: number;
      page: number;
      limit: number;
      totalPages?: number;
    };
    type UnifiedPagination = {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    type WithUnified = {
      data: unknown;
      meta: { pagination: UnifiedPagination };
    };
    type WithLegacy = { data: unknown; meta: LegacyMeta };
    type WithItems = { items: unknown[]; pagination: UnifiedPagination };
    type WithCollection = Record<string, unknown> & {
      pagination: UnifiedPagination;
    };

    return next.handle().pipe(
      map((payload: unknown) => {
        const baseMeta = {
          status: res.statusCode,
          message,
          timestamp: new Date().toISOString(),
          path: req.url,
        };
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'data' in payload &&
          'meta' in payload
        ) {
          const maybe = (payload as Partial<WithUnified>).meta as
            | Partial<WithUnified['meta']>
            | undefined;
          if (maybe && typeof maybe === 'object' && 'pagination' in maybe) {
            const p = payload as WithUnified;
            return {
              data: p.data,
              meta: { ...baseMeta, pagination: p.meta.pagination },
            };
          }
        }
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'data' in payload &&
          'meta' in payload
        ) {
          const meta = (payload as WithLegacy).meta as
            | Partial<LegacyMeta>
            | undefined;
          if (
            meta &&
            typeof meta === 'object' &&
            'total' in meta &&
            'page' in meta &&
            'limit' in meta
          ) {
            const pagination: UnifiedPagination = {
              page: Number(meta.page) || 1,
              limit: Number(meta.limit) || 20,
              total: Number(meta.total) || 0,
              pages:
                Number(meta.totalPages) ||
                Math.ceil(
                  (Number(meta.total) || 0) / (Number(meta.limit) || 1),
                ),
            };
            return {
              data: (payload as WithLegacy).data,
              meta: { ...baseMeta, pagination },
            };
          }
        }
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'pagination' in payload
        ) {
          const p = payload as Partial<WithItems>;
          if (Array.isArray(p.items) && p.pagination) {
            return {
              data: p.items,
              meta: { ...baseMeta, pagination: p.pagination },
            };
          }
        }
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'pagination' in (payload as Record<string, unknown>)
        ) {
          const p = payload as WithCollection;
          const coll = p[collectionKey];
          if (Array.isArray(coll)) {
            return {
              data: coll,
              meta: { ...baseMeta, pagination: p.pagination },
            };
          }
        }
        if (Array.isArray(payload as unknown[])) {
          return { data: payload as unknown[], meta: baseMeta };
        }
        return { data: payload, meta: baseMeta };
      }),
    );
  }
}
