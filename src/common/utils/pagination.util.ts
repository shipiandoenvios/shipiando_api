export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function buildPaginationMeta(
  total: number,
  page = 1,
  limit = 20,
): PaginationMeta {
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.max(1, Number(limit));
  return {
    page: safePage,
    limit: safeLimit,
    total,
    pages: Math.ceil(total / safeLimit),
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page?: number,
  limit?: number,
): PaginatedResult<T> {
  return {
    items,
    pagination: buildPaginationMeta(total, page, limit),
  };
}
