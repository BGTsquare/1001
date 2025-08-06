import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Import organized mock modules
import { createMockSupabaseClient } from './mocks/supabase'
import { 
  mockNextNavigation, 
  mockNextImage, 
  mockNextLink, 
  mockNextHeaders 
} from './mocks/next.tsx'
import { 
  mockTanStackQuery, 
  mockReactHookForm, 
  mockSonner 
} from './mocks/libraries'
import { 
  setupWindowMocks, 
  setupObserverMocks, 
  setupFileApiMocks, 
  setupWebApiMocks,
  createMockLocation
} from './mocks/browser-apis'

/**
 * Global test setup and cleanup
 */
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Reset DOM state
  document.body.innerHTML = ''
  
  // Reset window location for each test
  Object.defineProperty(window, 'location', {
    value: createMockLocation(),
    writable: true,
  })
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
})

/**
 * Initialize all mocks
 */
// Next.js mocks
mockNextNavigation()
mockNextImage()
mockNextLink()
mockNextHeaders()

// Supabase mocks
vi.mock('@/lib/supabase/client', () => ({
  createClient: createMockSupabaseClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createMockSupabaseClient,
}))

// Third-party library mocks
mockTanStackQuery()
mockReactHookForm()
mockSonner()

// Browser API mocks
setupWindowMocks()
setupObserverMocks()
setupFileApiMocks()
setupWebApiMocks()