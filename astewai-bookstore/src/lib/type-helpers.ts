/**
 * Type assertion helpers for build compatibility
 */

export function assertNonNull<T>(value: T | null | undefined): T {
  return value as T;
}

export function safeAccess<T>(obj: any, path: string, defaultValue: T): T {
  try {
    return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export function withFallback<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

// Database query result helpers
export type SafeQueryResult<T> = {
  data: T[] | null;
  error: any;
  count?: number | null;
};

export function safeQueryResult<T>(result: any): SafeQueryResult<T> {
  return {
    data: result?.data || null,
    error: result?.error || null,
    count: result?.count || null
  };
}