# Test Setup Documentation

This directory contains the comprehensive test setup and utilities for the Astewai Digital Bookstore application.

## Structure

```
src/test/
├── setup.ts              # Main test setup file (imported by Vitest)
├── utils.tsx              # Custom render functions and test utilities
├── README.md              # This documentation
└── mocks/                 # Organized mock modules
    ├── supabase.ts        # Supabase client and auth mocks
    ├── next.ts            # Next.js framework mocks
    ├── libraries.ts       # Third-party library mocks
    └── browser-apis.ts    # Browser API mocks
```

## Key Features

### 1. Modular Mock Organization
- **Separation of Concerns**: Mocks are organized by domain (Supabase, Next.js, etc.)
- **Reusable Components**: Mock functions can be imported and customized per test
- **Maintainable**: Easy to update mocks when APIs change

### 2. Comprehensive Browser API Mocks
- FileReader, File, Blob APIs for file upload testing
- IntersectionObserver, ResizeObserver for component visibility
- Window APIs (location, scrollTo, matchMedia)
- Crypto and Performance APIs

### 3. Test Utilities
- Custom render function with providers pre-configured
- Test data factories for consistent mock data
- Common assertion helpers
- File upload testing utilities

## Usage Examples

### Basic Component Testing
```typescript
import { renderWithProviders, expectElementToBeVisible } from '@/test/utils'
import { BookCard } from '@/components/books/book-card'

test('renders book card with title', () => {
  const book = createTestBook({ title: 'My Test Book' })
  const { getByText } = renderWithProviders(<BookCard book={book} />)
  
  const title = getByText('My Test Book')
  expectElementToBeVisible(title)
})
```

### Testing with Authentication
```typescript
import { renderWithProviders, mockAuthenticatedUser } from '@/test/utils'

test('shows user profile when authenticated', () => {
  const { session, profile } = mockAuthenticatedUser({ 
    full_name: 'John Doe' 
  })
  
  // Mock the auth context or Supabase calls as needed
  const { getByText } = renderWithProviders(<UserProfile />)
  
  expect(getByText('John Doe')).toBeInTheDocument()
})
```

### File Upload Testing
```typescript
import { createMockFile, renderWithProviders } from '@/test/utils'
import userEvent from '@testing-library/user-event'

test('handles file upload', async () => {
  const user = userEvent.setup()
  const file = createMockFile('book.pdf', 'application/pdf')
  
  const { getByLabelText } = renderWithProviders(<FileUpload />)
  const input = getByLabelText('Upload file')
  
  await user.upload(input, file)
  
  expect(input.files[0]).toBe(file)
})
```

### Custom Mock Data
```typescript
import { createTestBook, createTestBundle } from '@/test/utils'

test('displays bundle with books', () => {
  const books = [
    createTestBook({ title: 'Book 1' }),
    createTestBook({ title: 'Book 2' })
  ]
  const bundle = createTestBundle({ 
    title: 'My Bundle',
    books 
  })
  
  // Test component with bundle data
})
```

## Mock Customization

### Supabase Mocks
```typescript
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// In your test file
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    const client = createMockSupabaseClient()
    // Customize specific methods
    client.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: 1, title: 'Custom Book' }],
        error: null
      })
    })
    return client
  }
}))
```

### Next.js Router Mocks
```typescript
import { vi } from 'vitest'

// Override router behavior for specific tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    // ... other methods
  }),
  usePathname: () => '/custom-path',
  useSearchParams: () => new URLSearchParams('?param=value'),
}))
```

## Best Practices

### 1. Use Test Data Factories
- Always use `createTestBook()`, `createTestUser()`, etc.
- Override only the properties you need for the specific test
- This ensures consistent test data and makes tests more maintainable

### 2. Mock at the Right Level
- Mock external dependencies (Supabase, APIs) at the service level
- Don't mock internal application logic unless necessary
- Use the pre-configured mocks when possible

### 3. Clean Test Structure
```typescript
describe('BookCard Component', () => {
  it('should display book title and author', () => {
    // Arrange
    const book = createTestBook({ 
      title: 'Test Book', 
      author: 'Test Author' 
    })
    
    // Act
    const { getByText } = renderWithProviders(<BookCard book={book} />)
    
    // Assert
    expect(getByText('Test Book')).toBeInTheDocument()
    expect(getByText('Test Author')).toBeInTheDocument()
  })
})
```

### 4. Async Testing
```typescript
import { waitFor } from '@testing-library/react'

test('loads data asynchronously', async () => {
  const { getByText } = renderWithProviders(<AsyncComponent />)
  
  await waitFor(() => {
    expect(getByText('Loaded data')).toBeInTheDocument()
  })
})
```

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure the mock is defined before the component import
2. **Async operations**: Use `waitFor` or `findBy*` queries for async operations
3. **Context providers**: Use `renderWithProviders` instead of plain `render`
4. **File uploads**: Use `createMockFile` helper for consistent file mocking

### Debugging Tips

1. Use `screen.debug()` to see the current DOM state
2. Check that mocks are being called with `expect(mockFn).toHaveBeenCalled()`
3. Use `vi.clearAllMocks()` in `beforeEach` to avoid test interference
4. Enable verbose logging in Vitest config for detailed error messages

## Configuration

The test setup is automatically loaded by Vitest through the `setupFiles` configuration in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
  },
})
```

This ensures all mocks and utilities are available in every test file without manual imports.