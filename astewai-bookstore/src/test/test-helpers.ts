import { vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// API Route Testing Helpers
export const createMockRequest = (
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  body?: any,
  headers?: Record<string, string>
): NextRequest => {
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return request
}

export const createMockFormDataRequest = (
  url: string = 'http://localhost:3000/api/test',
  formData: FormData,
  headers?: Record<string, string>
): NextRequest => {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData,
  })
}

// Mock response helpers
export const mockJsonResponse = (data: any, status: number = 200) => {
  return NextResponse.json(data, { status })
}

export const mockErrorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status })
}

// Database Mock Helpers
export const createMockSupabaseResponse = <T>(
  data: T | null = null,
  error: any = null
) => ({
  data,
  error,
})

export const createMockSupabaseQuery = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(createMockSupabaseResponse()),
    maybeSingle: vi.fn().mockResolvedValue(createMockSupabaseResponse()),
  }

  // Make all methods chainable
  Object.keys(mockQuery).forEach(key => {
    if (typeof mockQuery[key as keyof typeof mockQuery] === 'function' && 
        !['single', 'maybeSingle'].includes(key)) {
      mockQuery[key as keyof typeof mockQuery] = vi.fn().mockReturnValue(mockQuery)
    }
  })

  return mockQuery
}

// Performance Testing Helpers
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

export const expectPerformance = (duration: number, maxDuration: number) => {
  expect(duration).toBeLessThan(maxDuration)
}

// Accessibility Testing Helpers
export const checkAccessibility = async (container: HTMLElement) => {
  // Check for basic accessibility requirements
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    expect(img).toHaveAttribute('alt')
  })

  const buttons = container.querySelectorAll('button')
  buttons.forEach(button => {
    expect(button).toBeVisible()
    expect(button).not.toHaveAttribute('disabled', 'true')
  })

  const inputs = container.querySelectorAll('input, textarea, select')
  inputs.forEach(input => {
    const label = container.querySelector(`label[for="${input.id}"]`)
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    expect(
      label || ariaLabel || ariaLabelledBy,
      `Input ${input.id || input.name || 'unknown'} should have a label`
    ).toBeTruthy()
  })
}

// Error Boundary Testing
export const TestErrorBoundary = ({ children, onError }: {
  children: React.ReactNode
  onError?: (error: Error) => void
}) => {
  try {
    return <>{children}</>
  } catch (error) {
    if (onError) {
      onError(error as Error)
    }
    return <div data-testid="error-boundary">Something went wrong</div>
  }
}

// Mock timers helpers
export const advanceTimers = (ms: number) => {
  vi.advanceTimersByTime(ms)
}

export const runAllTimers = () => {
  vi.runAllTimers()
}

// Network request mocking
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers(),
  })
}

export const mockFetchError = (error: string) => {
  global.fetch = vi.fn().mockRejectedValue(new Error(error))
}

// Component testing helpers
export const getByTestId = (container: HTMLElement, testId: string) => {
  const element = container.querySelector(`[data-testid="${testId}"]`)
  if (!element) {
    throw new Error(`Element with data-testid="${testId}" not found`)
  }
  return element
}

export const queryByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`)
}

// Form testing helpers
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react')
  
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { value } })
    }
  })
}

export const submitForm = async (form: HTMLFormElement) => {
  const { fireEvent } = await import('@testing-library/react')
  fireEvent.submit(form)
}

// Mock console methods for testing
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
  console.info = vi.fn()
  
  return {
    restore: () => {
      Object.assign(console, originalConsole)
    },
    mocks: {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    }
  }
}

// Test data generators
export const generateTestData = {
  email: (index: number = 1) => `test${index}@example.com`,
  password: () => 'TestPassword123!',
  uuid: (prefix: string = 'test') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: () => new Date().toISOString(),
  randomString: (length: number = 10) => Math.random().toString(36).substr(2, length),
  randomNumber: (min: number = 1, max: number = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
}

// Async testing utilities
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const start = Date.now()
  
  while (!condition() && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`)
  }
}

// Mock environment variables
export const mockEnv = (vars: Record<string, string>) => {
  const originalEnv = process.env
  
  process.env = {
    ...originalEnv,
    ...vars,
  }
  
  return {
    restore: () => {
      process.env = originalEnv
    }
  }
}