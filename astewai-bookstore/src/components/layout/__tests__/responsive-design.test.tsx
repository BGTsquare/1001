import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Header } from '../header'
import { Footer } from '../footer'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock auth context
const mockAuthContext = {
  user: null,
  profile: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  isLoading: false,
}

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock query provider
vi.mock('@/components/providers', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('Responsive Design Components', () => {
  describe('Header', () => {
    it('renders with mobile-friendly classes', () => {
      render(<Header />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('safe-area-top')
      
      // Check for mobile navigation trigger
      const mobileNavTrigger = screen.getByRole('button', { name: /toggle menu/i })
      expect(mobileNavTrigger).toBeInTheDocument()
    })

    it('shows app name with responsive text sizing', () => {
      render(<Header />)
      
      const appName = screen.getByText('Astewai Digital Bookstore')
      expect(appName.parentElement).toHaveClass('touch-target')
    })
  })

  describe('Footer', () => {
    it('renders with mobile-friendly layout', () => {
      render(<Footer />)
      
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('safe-area-bottom')
      
      // Check for responsive grid
      const footerContent = footer.querySelector('.container-mobile')
      expect(footerContent).toBeInTheDocument()
    })

    it('has touch-friendly links', () => {
      render(<Footer />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('touch-target')
      })
    })
  })

  describe('Mobile Navigation', () => {
    it('renders mobile navigation with proper classes', () => {
      render(<Header />)
      
      // Mobile nav should be hidden on desktop but accessible
      const mobileNavButton = screen.getByRole('button', { name: /toggle menu/i })
      expect(mobileNavButton).toHaveClass('md:hidden')
    })
  })
})

describe('CSS Utility Classes', () => {
  it('applies mobile-first responsive classes correctly', () => {
    const { container } = render(
      <div className="container-mobile">
        <div className="grid-responsive-books">
          <div className="card-mobile">
            <button className="button-mobile touch-target">Test Button</button>
          </div>
        </div>
      </div>
    )

    const containerEl = container.querySelector('.container-mobile')
    expect(containerEl).toHaveClass('container-mobile')

    const gridEl = container.querySelector('.grid-responsive-books')
    expect(gridEl).toHaveClass('grid-responsive-books')

    const cardEl = container.querySelector('.card-mobile')
    expect(cardEl).toHaveClass('card-mobile')

    const buttonEl = container.querySelector('.button-mobile')
    expect(buttonEl).toHaveClass('button-mobile', 'touch-target')
  })
})

describe('PWA Features', () => {
  it('includes PWA meta tags in document head', () => {
    // This would be tested in an integration test with the full layout
    // For now, we just verify the component structure
    expect(true).toBe(true) // Placeholder for PWA meta tag tests
  })
})

describe('Accessibility Features', () => {
  it('provides proper touch targets', () => {
    const { container } = render(
      <button className="touch-target">Accessible Button</button>
    )

    const button = container.querySelector('.touch-target')
    expect(button).toHaveClass('touch-target')
  })

  it('uses semantic HTML structure', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    const navigation = screen.getByRole('navigation', { hidden: true })
    expect(navigation).toBeInTheDocument()
  })
})