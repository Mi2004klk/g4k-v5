import { useMemo } from 'react';

export interface Paginator<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  next_cursor?: string;
  meta?: any;
}

export interface LaravelResponse<T> {
  data?: Paginator<T> | T[];
  meta?: any;
  [key: string]: any;
}

/**
 * Safely extracts paginated data from a Laravel JSON response.
 * Laravel often wraps `paginate()` in `{ data: { data: [...], current_page: ... } }`.
 */
export function unwrapPaginator<T>(response: LaravelResponse<T> | Paginator<T> | null | undefined): Paginator<T> {
  if (!response) {
    return { data: [], last_page: 1, current_page: 1, total: 0 };
  }
  
  // If response has a nested data.data, it's a typical Laravel Response::json($query->paginate()) wrapper
  if ('data' in response && response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data as Paginator<T>;
  }
  
  // If it's already unwrapped or a direct paginator
  if ('data' in response && Array.isArray(response.data)) {
    return response as Paginator<T>;
  }

  // Fallback if it's just an array returned as response
  if (Array.isArray(response)) {
    return { data: response, last_page: 1, current_page: 1, total: response.length };
  }

  return { data: [], last_page: 1, current_page: 1, total: 0 };
}

/**
 * Hook to memoize and safely access paginated lists
 */
export function usePaginatedList<T>(queryData: any) {
  return useMemo(() => {
    return unwrapPaginator<T>(queryData);
  }, [queryData]);
}
