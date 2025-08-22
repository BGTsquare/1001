import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  // Defensive: Only call cookies() if inside a request context
  let cookiesApi: any = undefined;
  try {
    cookiesApi = cookies();
  } catch (error) {
    // Not in a request context, return undefined or no-op
    cookiesApi = {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    };
  }
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookiesApi.get ? cookiesApi.get(name)?.value : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          if (cookiesApi.set) {
            try {
              cookiesApi.set(name, value, options);
            } catch (error) {}
          }
        },
        remove(name: string, options: CookieOptions) {
          if (cookiesApi.set) {
            try {
              cookiesApi.set(name, '', options);
            } catch (error) {}
          }
        },
      },
    }
  );
}
