import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { createMockBook, createMockUser } from '@/test/utils'

describe('Test Setup Validation', () => {
  it('can render a simple component', () => {
    render(<div data-testid="test-component">Hello World</div>)
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })

  it('can create mock data', () => {
    const book = createTestBook()
    expect(book).toHaveProperty('id')
    expect(book).toHaveProperty('title')
    expect(book).toHaveProperty('author')

    const user = createMockUser()
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('email')
  })

  it('has proper test utilities available', () => {
    expect(screen).toBeDefined()
    expect(render).toBeDefined()
  })

  it('can handle async operations', async () => {
    const promise = Promise.resolve('test')
    const result = await promise
    expect(result).toBe('test')
  })

  it('has mocked dependencies', () => {
    // Verify that our mocks are working
    expect(vi).toBeDefined()
    expect(vi.fn).toBeDefined()
  })
})