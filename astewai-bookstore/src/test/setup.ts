import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  }),
}))

// Mock Supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
  },
  writable: true,
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null
  error: DOMException | null = null
  readyState: number = 0
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null

  readAsDataURL(file: Blob): void {
    this.readyState = 2
    this.result = `data:${file.type};base64,mock-base64-data`
    if (this.onload) {
      this.onload({ target: this } as any)
    }
  }

  readAsText(file: Blob): void {
    this.readyState = 2
    this.result = 'mock-text-content'
    if (this.onload) {
      this.onload({ target: this } as any)
    }
  }

  abort(): void {
    this.readyState = 2
    if (this.onabort) {
      this.onabort({ target: this } as any)
    }
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true }
}