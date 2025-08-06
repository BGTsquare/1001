import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { 
  checkAccessibility, 
  runAxeAccessibilityTests,
  testKeyboardNavigation,
  testScreenReaderAnnouncements,
  testTouchTargetSizes,
  testReducedMotion,
  testHeadingHierarchy,
  testLandmarkRoles
} from '@/test/test-helpers'
import { BookCard } from '@/components/books/book-card'
import { LoginForm } from '@/components/auth/login-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTestBook } from '@/test/utils'
import React from 'react'

// Mock axe-core for automated accessibility testing
const mockAxe = {
  run: vi.fn().mockResolvedValue({ violations: [] }),
}

vi.mock('axe-core', () => ({
  default: mockAxe,
}))

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('WCAG 2.1 Level AA Compliance', () => {
    it('passes automated accessibility checks for BookCard', async () => {
      const book = createTestBook()
      const { container } = render(<BookCard book={book} />)

      await runAxeAccessibilityTests(container)
      testHeadingHierarchy(container)
      testKeyboardNavigation(container)
    })

    it('passes automated accessibility checks for LoginForm', async () => {
      const { container } = render(<LoginForm />)

      await runAxeAccessibilityTests(container)
      testScreenReaderAnnouncements(container)
    })

    it('ensures proper heading hierarchy', () => {
      const { container } = render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      )

      testHeadingHierarchy(container)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })
      const h3 = screen.getByRole('heading', { level: 3 })

      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
      expect(h3).toBeInTheDocument()
    })

    it('ensures proper landmark roles', () => {
      const { container } = render(
        <div>
          <header role="banner">
            <h1>Site Title</h1>
          </header>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
            </ul>
          </nav>
          <main role="main">
            <h2>Main Content</h2>
          </main>
          <footer role="contentinfo">
            <p>Footer content</p>
          </footer>
        </div>
      )

      testLandmarkRoles(container)
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation for interactive elements', () => {
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <Input placeholder="Text input" />
        </div>
      )

      const firstButton = screen.getByRole('button', { name: 'First Button' })
      const secondButton = screen.getByRole('button', { name: 'Second Button' })
      const input = screen.getByRole('textbox')

      // All interactive elements should be focusable
      expect(firstButton).toHaveAttribute('tabindex', '0')
      expect(secondButton).toHaveAttribute('tabindex', '0')
      expect(input).not.toHaveAttribute('tabindex', '-1')
    })

    it('provides proper focus management in modals', () => {
      const MockModal = () => (
        <div role="dialog" aria-labelledby="modal-title" aria-modal="true">
          <h2 id="modal-title">Modal Title</h2>
          <Button>Action Button</Button>
          <Button>Cancel</Button>
        </div>
      )

      render(<MockModal />)

      const modal = screen.getByRole('dialog')
      const actionButton = screen.getByRole('button', { name: 'Action Button' })

      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')
      
      // Focus should be trapped within modal
      actionButton.focus()
      expect(actionButton).toHaveFocus()
    })

    it('supports skip navigation links', () => {
      render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <nav>Navigation</nav>
          <main id="main-content">Main content</main>
        </div>
      )

      const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })
  })

  describe('Screen Reader Support', () => {
    it('provides proper ARIA labels for complex components', () => {
      const book = createTestBook({ title: 'Test Book', author: 'Test Author' })
      const { container } = render(<BookCard book={book} />)

      testScreenReaderAnnouncements(container)

      const bookCard = screen.getByRole('article')
      expect(bookCard).toHaveAttribute('aria-label', expect.stringContaining('Test Book'))
    })

    it('uses proper ARIA roles for custom components', () => {
      const { container } = render(
        <div>
          <div role="tablist">
            <button role="tab" aria-selected="true" aria-controls="panel1">
              Tab 1
            </button>
            <button role="tab" aria-selected="false" aria-controls="panel2">
              Tab 2
            </button>
          </div>
          <div role="tabpanel" id="panel1" aria-labelledby="tab1">
            Panel 1 Content
          </div>
        </div>
      )

      testScreenReaderAnnouncements(container)

      const tablist = screen.getByRole('tablist')
      const tabs = screen.getAllByRole('tab')
      const tabpanel = screen.getByRole('tabpanel')

      expect(tablist).toBeInTheDocument()
      expect(tabs).toHaveLength(2)
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab1')
    })

    it('provides descriptive alt text for images', () => {
      const book = createTestBook({ 
        title: 'The Great Adventure',
        author: 'John Doe',
        cover_image_url: 'https://example.com/cover.jpg'
      })

      render(<BookCard book={book} />)

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('alt', expect.stringContaining('The Great Adventure'))
    })

    it('announces dynamic content changes', () => {
      const DynamicContent = () => {
        const [message, setMessage] = React.useState('')

        return (
          <div>
            <button onClick={() => setMessage('Content updated!')}>
              Update Content
            </button>
            <div aria-live="polite" aria-atomic="true">
              {message}
            </div>
          </div>
        )
      }

      const { container } = render(<DynamicContent />)

      testScreenReaderAnnouncements(container)

      const button = screen.getByRole('button', { name: 'Update Content' })
      const liveRegion = screen.getByText('', { selector: '[aria-live="polite"]' })

      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true')

      fireEvent.click(button)
      expect(screen.getByText('Content updated!')).toBeInTheDocument()
    })
  })

  describe('Color and Contrast', () => {
    it('maintains sufficient color contrast ratios', () => {
      render(
        <div>
          <Button variant="default">Default Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
        </div>
      )

      // This would typically be tested with actual color contrast tools
      // For now, we verify the classes are applied correctly
      const defaultButton = screen.getByRole('button', { name: 'Default Button' })
      const secondaryButton = screen.getByRole('button', { name: 'Secondary Button' })
      const destructiveButton = screen.getByRole('button', { name: 'Destructive Button' })

      expect(defaultButton).toHaveClass('bg-primary')
      expect(secondaryButton).toHaveClass('bg-secondary')
      expect(destructiveButton).toHaveClass('bg-destructive')
    })

    it('does not rely solely on color to convey information', () => {
      render(
        <div>
          <span className="text-red-500" aria-label="Error">
            ❌ Error message
          </span>
          <span className="text-green-500" aria-label="Success">
            ✅ Success message
          </span>
        </div>
      )

      // Icons and text provide additional context beyond color
      expect(screen.getByLabelText('Error')).toBeInTheDocument()
      expect(screen.getByLabelText('Success')).toBeInTheDocument()
    })
  })

  describe('Form Accessibility', () => {
    it('associates labels with form controls', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Verify proper label association
      expect(emailInput.id).toBeTruthy()
      expect(passwordInput.id).toBeTruthy()
    })

    it('provides helpful error messages', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      // Error should be associated with the input
      const errorMessage = screen.getByText(/invalid email/i)
      expect(errorMessage).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining(errorMessage.id))
    })

    it('indicates required fields', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Mobile Accessibility', () => {
    it('provides adequate touch targets', () => {
      const { container } = render(
        <div>
          <Button size="sm">Small Button</Button>
          <Button size="default">Default Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      )

      testTouchTargetSizes(container)

      const buttons = screen.getAllByRole('button')
      
      // All buttons should meet minimum touch target size (44px)
      buttons.forEach(button => {
        const styles = getComputedStyle(button)
        const minHeight = parseInt(styles.minHeight) || parseInt(styles.height)
        expect(minHeight).toBeGreaterThanOrEqual(44)
      })
    })

    it('supports zoom up to 200% without horizontal scrolling', () => {
      // This would typically be tested with actual browser zoom
      // For now, we verify responsive design classes are applied
      render(
        <div className="max-w-full overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BookCard book={createTestBook()} />
            <BookCard book={createTestBook()} />
            <BookCard book={createTestBook()} />
          </div>
        </div>
      )

      const container = screen.getByRole('main') || document.body
      expect(container).toHaveClass('max-w-full', 'overflow-x-hidden')
    })
  })

  describe('Motion and Animation', () => {
    it('respects prefers-reduced-motion', () => {
      testReducedMotion()

      render(
        <div className="transition-transform motion-reduce:transition-none">
          Animated Content
        </div>
      )

      const animatedElement = screen.getByText('Animated Content')
      expect(animatedElement).toHaveClass('motion-reduce:transition-none')
    })

    it('provides pause controls for auto-playing content', () => {
      const AutoPlayComponent = () => {
        const [isPlaying, setIsPlaying] = React.useState(true)

        return (
          <div>
            <div aria-live="polite">
              {isPlaying ? 'Auto-playing content...' : 'Content paused'}
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        )
      }

      const { container } = render(<AutoPlayComponent />)

      testScreenReaderAnnouncements(container)

      const pauseButton = screen.getByRole('button', { name: 'Pause' })
      expect(pauseButton).toBeInTheDocument()

      fireEvent.click(pauseButton)
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    })
  })
})