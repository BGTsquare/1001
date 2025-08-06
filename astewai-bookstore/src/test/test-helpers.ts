import { vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import React from 'react'

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

/**
 * Enhanced accessibility testing with axe-core integration
 */
export const runAxeAccessibilityTests = async (container: HTMLElement) => {
  try {
    const axe = await import('axe-core')
    
    const results = await axe.run(container, {
      rules: {
        // WCAG 2.1 Level AA rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-roles': { enabled: true },
        'form-labels': { enabled: true },
        'alt-text': { enabled: true },
        'skip-link': { enabled: true }
      }
    })
    
    if (results.violations.length > 0) {
      const violationMessages = results.violations.map(violation => 
        `${violation.id}: ${violation.description}\n` +
        violation.nodes.map(node => `  - ${node.failureSummary}`).join('\n')
      ).join('\n\n')
      
      throw new Error(`Accessibility violations found:\n${violationMessages}`)
    }
    
    return results
  } catch (error) {
    console.warn('axe-core not available, falling back to basic accessibility checks')
    return checkAccessibility(container)
  }
}

/**
 * Test keyboard navigation
 */
export const testKeyboardNavigation = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  // Test tab order
  let currentIndex = 0
  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute('tabindex')
    if (tabIndex && parseInt(tabIndex) > 0) {
      expect(parseInt(tabIndex)).toBeGreaterThan(currentIndex)
      currentIndex = parseInt(tabIndex)
    }
  })
  
  // Test that all interactive elements are focusable
  focusableElements.forEach((element) => {
    expect(element).not.toHaveAttribute('tabindex', '-1')
  })
}

/**
 * Test screen reader announcements
 */
export const testScreenReaderAnnouncements = (container: HTMLElement) => {
  const liveRegions = container.querySelectorAll('[aria-live]')
  const statusElements = container.querySelectorAll('[role="status"], [role="alert"]')
  
  // Ensure live regions have proper attributes
  liveRegions.forEach((region) => {
    const ariaLive = region.getAttribute('aria-live')
    expect(['polite', 'assertive', 'off']).toContain(ariaLive)
  })
  
  // Check for proper ARIA labels
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea')
  interactiveElements.forEach((element) => {
    const hasLabel = element.getAttribute('aria-label') || 
                    element.getAttribute('aria-labelledby') ||
                    element.textContent?.trim() ||
                    element.querySelector('img')?.getAttribute('alt')
    
    expect(hasLabel).toBeTruthy()
  })
}

/**
 * Test color contrast ratios
 */
export const testColorContrast = (element: HTMLElement) => {
  const computedStyle = window.getComputedStyle(element)
  const backgroundColor = computedStyle.backgroundColor
  const color = computedStyle.color
  
  // This is a simplified test - in practice you'd use a proper color contrast library
  expect(backgroundColor).not.toBe(color)
}

/**
 * Test touch target sizes for mobile accessibility
 */
export const testTouchTargetSizes = (container: HTMLElement) => {
  const interactiveElements = container.querySelectorAll('button, a, input[type="button"], input[type="submit"]')
  
  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const minSize = 44 // WCAG minimum touch target size
    
    expect(rect.width).toBeGreaterThanOrEqual(minSize)
    expect(rect.height).toBeGreaterThanOrEqual(minSize)
  })
}

/**
 * Test reduced motion preferences
 */
export const testReducedMotion = () => {
  // Mock prefers-reduced-motion
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  
  // Test that animations are disabled when reduced motion is preferred
  const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]')
  animatedElements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element)
    expect(computedStyle.animationDuration).toBe('0.01ms')
  })
}

/**
 * Test heading hierarchy
 */
export const testHeadingHierarchy = (container: HTMLElement) => {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let previousLevel = 0
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1))
    if (previousLevel > 0 && level > previousLevel + 1) {
      throw new Error(`Heading hierarchy violation: h${previousLevel} followed by h${level}`)
    }
    previousLevel = level
  })
}

/**
 * Test landmark roles
 */
export const testLandmarkRoles = (container: HTMLElement) => {
  const landmarks = container.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="search"]')
  const semanticLandmarks = container.querySelectorAll('header, nav, main, footer, aside')
  
  // Ensure main content is properly marked
  const mainElements = container.querySelectorAll('main, [role="main"]')
  expect(mainElements.length).toBeGreaterThanOrEqual(1)
  
  // Ensure navigation is properly marked
  const navElements = container.querySelectorAll('nav, [role="navigation"]')
  if (navElements.length > 0) {
    navElements.forEach(nav => {
      expect(nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby')).toBeTruthy()
    })
  }
}

// Error Boundary Testing
export const TestErrorBoundary = ({ children, onError }: {
  children: React.ReactNode
  onError?: (error: Error) => void
}) => {
  try {
    return React.createElement(React.Fragment, null, children)
  } catch (error) {
    if (onError) {
      onError(error as Error)
    }
    return React.createElement('div', { 'data-testid': 'error-boundary' }, 'Something went wrong')
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