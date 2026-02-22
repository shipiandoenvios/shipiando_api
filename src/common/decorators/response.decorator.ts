import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

export const META_RESPONSE_MESSAGE = 'meta:response_message';
export const META_COLLECTION_KEY = 'meta:collection_key';

export const ApiSuccessMessage = (message: string) =>
  SetMetadata(META_RESPONSE_MESSAGE, message);

export const ApiCollectionKey = (key: string) =>
  SetMetadata(META_COLLECTION_KEY, key);

type PageQuery = { page?: unknown; limit?: unknown };

export const PaginationQuery = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const { page: rawPage, limit: rawLimit } = (req.query ??
      {}) as unknown as PageQuery;
    const page =
      typeof rawPage === 'string' || typeof rawPage === 'number'
        ? Number(rawPage)
        : 1;
    const limit =
      typeof rawLimit === 'string' || typeof rawLimit === 'number'
        ? Number(rawLimit)
        : 20;
    return { page, limit };
  },
);
