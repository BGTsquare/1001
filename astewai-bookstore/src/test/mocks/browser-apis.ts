import { vi } from 'vitest'

/**
 * Browser API mocks for testing environment
 */

/**
 * Window location mock with common methods
 */
export const createMockLocation = () => ({
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  href: 'http://localhost:3000/',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
})

/**
 * Setup window API mocks
 */
export const setupWindowMocks = () => {
  // Window location
  Object.defineProperty(window, 'location', {
    value: createMockLocation(),
    writable: true,
  })

  // Scroll methods
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
  })

  // Media queries
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  })
}

/**
 * Observer API mocks
 */
export const setupObserverMocks = () => {
  // IntersectionObserver
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })) as any

  // ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })) as any
}

/**
 * File API mocks
 */
export const setupFileApiMocks = () => {
  // Enhanced FileReader mock
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
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: this } as any)
        }
      }, 0)
    }

    readAsText(file: Blob): void {
      this.readyState = 2
      this.result = 'mock-text-content'
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: this } as any)
        }
      }, 0)
    }

    readAsArrayBuffer(file: Blob): void {
      this.readyState = 2
      this.result = new ArrayBuffer(8)
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: this } as any)
        }
      }, 0)
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

  // File and Blob mocks
  global.File = class File extends Blob {
    name: string
    lastModified: number
    
    constructor(chunks: BlobPart[], filename: string, options?: FilePropertyBag) {
      super(chunks, options)
      this.name = filename
      this.lastModified = Date.now()
    }
    
    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new ArrayBuffer(8))
    }
  } as any

  // URL object methods
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url')
  global.URL.revokeObjectURL = vi.fn()
}

/**
 * Crypto and performance API mocks
 */
export const setupWebApiMocks = () => {
  // Crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'mock-uuid-1234'),
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      }),
    },
  })

  // Performance API
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
    },
  })
}