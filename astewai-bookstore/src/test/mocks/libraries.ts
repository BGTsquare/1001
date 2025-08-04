import { vi } from 'vitest'

/**
 * TanStack Query mocks
 */
export const mockTanStackQuery = () => {
  vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(() => ({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    })),
    QueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    })),
  }))
}

/**
 * React Hook Form mocks
 */
export const mockReactHookForm = () => {
  vi.mock('react-hook-form', () => ({
    useForm: vi.fn(() => ({
      register: vi.fn(() => ({
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'test',
        ref: vi.fn(),
      })),
      handleSubmit: vi.fn((fn) => vi.fn()),
      formState: {
        errors: {},
        isSubmitting: false,
        isValid: true,
      },
      watch: vi.fn(),
      setValue: vi.fn(),
      getValues: vi.fn(),
      reset: vi.fn(),
    })),
    Controller: ({ render }: any) => render({ field: { onChange: vi.fn(), value: '' } }),
  }))
}

/**
 * Sonner toast notifications mock
 */
export const mockSonner = () => {
  vi.mock('sonner', () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  }))
}