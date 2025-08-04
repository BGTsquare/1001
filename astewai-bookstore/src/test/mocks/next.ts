import { vi } from 'vitest'

/**
 * Next.js navigation mocks
 */
export const mockNextNavigation = () => {
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
    notFound: vi.fn(),
    redirect: vi.fn(),
  }))
}

/**
 * Next.js Image component mock
 */
export const mockNextImage = () => {
  vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} {...props} />
    },
  }))
}

/**
 * Next.js Link component mock
 */
export const mockNextLink = () => {
  vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }))
}

/**
 * Next.js headers and cookies mock
 */
export const mockNextHeaders = () => {
  vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      getAll: vi.fn(() => []),
    })),
    headers: vi.fn(() => ({
      get: vi.fn(),
      has: vi.fn(),
      entries: vi.fn(() => []),
    })),
  }))
}