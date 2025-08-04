# Testing Guide

This document outlines the comprehensive testing strategy for the Astewai Digital Bookstore application.

## Testing Philosophy

Our testing approach follows the testing pyramid:
- **Unit Tests (70%)**: Fast, isolated tests for individual components and functions
- **Integration Tests (20%)**: Tests for component interactions and API routes
- **End-to-End Tests (10%)**: Full user journey tests

## Test Types

### 1. Unit Tests

Unit tests focus on testing individual components, functions, and utilities in isolation.

**Location**: `src/**/*.test.{ts,tsx}`

**Run Command**: `pnpm test:unit`

**Examples**:
- Component rendering and props
- Utility function behavior
- Hook functionality
- Form validation logic

```typescript
// Example unit test
import { render, screen } from '@/test/utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
})
```

### 2. Integration Tests

Integration tests verify that different parts of the application work together correctly.

**Location**: `src/**/*.integration.test.{ts,tsx}`

**Run Command**: `pnpm test:integration`

**Examples**:
- API route handlers with database operations
- Component interactions with services
- Form submission workflows

```typescript
// Example integration test
import { POST } from '@/app/api/books/route'
import { createMockRequest } from '@/test/test-helpers'

describe('/api/books integration', () => {
  it('creates book and updates database', async () => {
    const request = createMockRequest('POST', '/api/books', bookData)
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

### 3. End-to-End Tests

E2E tests simulate complete user journeys from start to finish.

**Location**: `src/test/e2e/**/*.test.{ts,tsx}`

**Run Command**: `pnpm test:e2e`

**Examples**:
- User registration and login flow
- Book purchase workflow
- Admin content management

```typescript
// Example E2E test
describe('User Authentication E2E', () => {
  it('completes full registration process', async () => {
    // Test complete user registration flow
    render(<RegisterForm />)
    // ... fill form and submit
    expect(screen.getByText(/account created/i)).toBeInTheDocument()
  })
})
```

### 4. Performance Tests

Performance tests ensure the application meets performance requirements.

**Location**: `src/test/performance/**/*.test.{ts,tsx}`

**Run Command**: `pnpm test:performance`

**Examples**:
- Component render times
- Large dataset handling
- Memory usage optimization

```typescript
// Example performance test
import { measurePerformance, expectPerformance } from '@/test/test-helpers'

describe('BookGrid Performance', () => {
  it('renders 100 books within performance budget', async () => {
    const duration = await measurePerformance(async () => {
      render(<BookGrid books={books} />)
    })
    expectPerformance(duration, 500) // Should render in under 500ms
  })
})
```

### 5. Accessibility Tests

Accessibility tests ensure WCAG 2.1 Level AA compliance.

**Location**: `src/test/accessibility/**/*.test.{ts,tsx}`

**Run Command**: `pnpm test:accessibility`

**Examples**:
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- ARIA attributes

```typescript
// Example accessibility test
import { checkAccessibility } from '@/test/test-helpers'

describe('Accessibility', () => {
  it('passes WCAG 2.1 Level AA checks', async () => {
    const { container } = render(<BookCard book={mockBook} />)
    await checkAccessibility(container)
  })
})
```

## Test Utilities

### Test Setup

All tests use a common setup file that provides:
- Mock implementations for external dependencies
- Global test utilities
- Consistent test environment

**Location**: `src/test/setup.ts`

### Test Utilities

Common utilities for testing:
- `render()`: Enhanced render function with providers
- `createMockBook()`: Generate mock book data
- `createMockUser()`: Generate mock user data
- `measurePerformance()`: Performance measurement utility
- `checkAccessibility()`: Accessibility validation

**Location**: `src/test/utils.tsx`, `src/test/test-helpers.ts`

### Mock Data

Consistent mock data generators for:
- Books and bundles
- Users and profiles
- Library items
- Purchase requests

## Running Tests

### All Tests
```bash
pnpm test
```

### Specific Test Types
```bash
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
pnpm test:e2e          # End-to-end tests only
pnpm test:performance  # Performance tests only
pnpm test:accessibility # Accessibility tests only
```

### Test Categories
```bash
pnpm test:components   # Component tests only
pnpm test:api         # API route tests only
pnpm test:services    # Service layer tests only
```

### Development
```bash
pnpm test:watch       # Watch mode for development
pnpm test:ui          # Visual test runner
pnpm test:coverage    # Generate coverage report
```

## Coverage Requirements

We maintain high test coverage standards:

- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

Coverage reports are generated in the `coverage/` directory and include:
- HTML report for detailed analysis
- LCOV format for CI/CD integration
- JSON format for programmatic access

## Continuous Integration

Our CI/CD pipeline runs:

1. **Code Quality Checks**
   - TypeScript compilation
   - ESLint linting
   - Prettier formatting

2. **Test Execution**
   - Unit tests with coverage
   - Integration tests
   - E2E tests
   - Performance tests
   - Accessibility tests

3. **Performance Monitoring**
   - Lighthouse CI for web vitals
   - Bundle size analysis
   - Performance regression detection

4. **Security Scanning**
   - Dependency vulnerability checks
   - Static analysis security testing (SAST)
   - Code quality analysis

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should clearly describe what is being tested
3. **Test Behavior, Not Implementation**: Focus on what the code does, not how
4. **Keep Tests Independent**: Each test should be able to run in isolation
5. **Use Proper Mocking**: Mock external dependencies, not internal logic

### Test Organization

1. **Co-locate Tests**: Keep tests close to the code they test
2. **Group Related Tests**: Use `describe` blocks to organize related tests
3. **Use Consistent Naming**: Follow naming conventions for test files and functions
4. **Maintain Test Data**: Use factories and builders for consistent test data

### Performance Considerations

1. **Optimize Test Setup**: Minimize expensive operations in test setup
2. **Use Appropriate Test Types**: Don't use E2E tests for unit-level functionality
3. **Parallel Execution**: Configure tests to run in parallel when possible
4. **Clean Up Resources**: Properly clean up after tests to prevent memory leaks

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `waitFor` for async operations
2. **Mock Issues**: Ensure mocks are properly reset between tests
3. **DOM Cleanup**: Verify DOM is cleaned up between tests
4. **Timing Issues**: Use proper async/await patterns

### Debugging Tools

1. **Test UI**: Use `pnpm test:ui` for visual debugging
2. **Debug Mode**: Add `debugger` statements and run with `--inspect`
3. **Console Logging**: Use `screen.debug()` to inspect DOM state
4. **Coverage Reports**: Use coverage reports to identify untested code

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD when possible
2. **Maintain Coverage**: Ensure new code meets coverage requirements
3. **Update Documentation**: Update this guide when adding new test patterns
4. **Review Test Quality**: Ensure tests are maintainable and valuable

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Performance Testing](https://web.dev/performance/)