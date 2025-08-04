import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'
import { createMockSession, createMockProfile } from './mocks/supabase'

/**
 * Custom render function with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialAuthState?: {
    session?: any
    profile?: any
    loading?: boolean
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    initialAuthState = {},
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Test data factories
 */
export const createTestBook = (overrides = {}) => ({
  id: 'test-book-id',
  title: 'Test Book',
  author: 'Test Author',
  description: 'A test book description',
  price: 9.99,
  cover_image_url: 'https://example.com/cover.jpg',
  file_url: 'https://example.com/book.pdf',
  category: 'Fiction',
  tags: ['test', 'fiction'],
  status: 'approved',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestBundle = (overrides = {}) => ({
  id: 'test-bundle-id',
  title: 'Test Bundle',
  description: 'A test bundle description',
  price: 19.99,
  original_price: 29.99,
  cover_image_url: 'https://example.com/bundle-cover.jpg',
  books: [createTestBook()],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestLibraryItem = (overrides = {}) => ({
  id: 'test-library-item-id',
  user_id: 'test-user-id',
  book_id: 'test-book-id',
  status: 'owned',
  progress: 0,
  last_read_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  book: createTestBook(),
  ...overrides,
})

/**
 * Mock helpers for common scenarios
 */
export const mockAuthenticatedUser = (userOverrides = {}) => {
  const session = createMockSession()
  const profile = createMockProfile(userOverrides)
  
  return { session, profile }
}

export const mockAdminUser = () => {
  return mockAuthenticatedUser({ role: 'admin' })
}

/**
 * Wait for async operations in tests
 */
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

/**
 * Common test assertions
 */
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

/**
 * File upload test helpers
 */
export const createMockFile = (
  name = 'test.pdf',
  type = 'application/pdf',
  size = 1024
) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

export const createMockImageFile = (
  name = 'test.jpg',
  type = 'image/jpeg'
) => {
  return createMockFile(name, type, 2048)
}

/**
 * Form testing helpers
 */
export const fillFormField = async (
  getByLabelText: any,
  label: string,
  value: string
) => {
  const field = getByLabelText(label)
  await userEvent.clear(field)
  await userEvent.type(field, value)
  return field
}

// Re-export commonly used testing utilities
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { vi } from 'vitest'