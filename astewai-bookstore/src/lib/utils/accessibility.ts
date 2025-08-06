/**
 * Accessibility utilities for WCAG 2.1 Level AA compliance
 */

import { useEffect, useRef, useState } from 'react'

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = []

  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.restoreFocus()
      }
    }

    // Store current focus and focus first element
    this.storeFocus()
    firstElement?.focus()

    // Add event listeners
    document.addEventListener('keydown', handleTabKey)
    document.addEventListener('keydown', handleEscapeKey)

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }

  /**
   * Store current focus for later restoration
   */
  static storeFocus(): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement)
    }
  }

  /**
   * Restore previously stored focus
   */
  static restoreFocus(): void {
    const elementToFocus = this.focusStack.pop()
    if (elementToFocus) {
      elementToFocus.focus()
    }
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        const htmlElement = element as HTMLElement
        return htmlElement.offsetWidth > 0 && htmlElement.offsetHeight > 0
      }) as HTMLElement[]
  }
}

/**
 * Skip navigation link component utilities
 */
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  return {
    href: `#${targetId}`,
    text,
    className: 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg'
  }
}

/**
 * ARIA live region announcer
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer
  private liveRegion: HTMLElement | null = null

  static getInstance(): LiveAnnouncer {
    if (!this.instance) {
      this.instance = new LiveAnnouncer()
    }
    return this.instance
  }

  private constructor() {
    this.createLiveRegion()
  }

  private createLiveRegion(): void {
    if (typeof window === 'undefined') return

    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.className = 'sr-only'
    document.body.appendChild(this.liveRegion)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return

    this.liveRegion.setAttribute('aria-live', priority)
    this.liveRegion.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = ''
      }
    }, 1000)
  }
}

/**
 * React hooks for accessibility
 */

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const cleanup = FocusManager.trapFocus(containerRef.current)
    return cleanup
  }, [isActive])

  return containerRef
}

/**
 * Hook for announcing messages to screen readers
 */
export function useLiveAnnouncer() {
  const announcer = LiveAnnouncer.getInstance()

  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => {
      announcer.announce(message, priority)
    }
  }
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for managing high contrast preferences
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}

/**
 * Keyboard navigation utilities
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation in grids/lists
   */
  handleArrowKeys: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    columns: number = 1
  ): number => {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        newIndex = Math.max(0, currentIndex - columns)
        break
      case 'ArrowDown':
        event.preventDefault()
        newIndex = Math.min(items.length - 1, currentIndex + columns)
        break
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = Math.max(0, currentIndex - 1)
        break
      case 'ArrowRight':
        event.preventDefault()
        newIndex = Math.min(items.length - 1, currentIndex + 1)
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
    }

    if (newIndex !== currentIndex) {
      items[newIndex]?.focus()
    }

    return newIndex
  }
}

/**
 * Color contrast utilities
 */
export const ColorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = ColorContrast.getLuminance(...color1)
    const lum2 = ColorContrast.getLuminance(...color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  },

  /**
   * Check if contrast ratio meets WCAG AA standards
   */
  meetsWCAGAA: (contrastRatio: number, isLargeText: boolean = false): boolean => {
    return contrastRatio >= (isLargeText ? 3 : 4.5)
  }
}

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Generate descriptive text for complex UI elements
   */
  describeElement: (element: {
    type: string
    label?: string
    value?: string | number
    state?: string
    position?: { current: number; total: number }
  }): string => {
    let description = element.type

    if (element.label) {
      description += `, ${element.label}`
    }

    if (element.value !== undefined) {
      description += `, ${element.value}`
    }

    if (element.state) {
      description += `, ${element.state}`
    }

    if (element.position) {
      description += `, ${element.position.current} of ${element.position.total}`
    }

    return description
  },

  /**
   * Create accessible loading state description
   */
  describeLoadingState: (isLoading: boolean, loadingText?: string): string => {
    if (!isLoading) return ''
    return loadingText || 'Loading, please wait'
  }
}