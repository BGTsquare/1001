'use client'

import Link from 'next/link'
import { createSkipLink } from '@/lib/utils/accessibility'

interface SkipNavigationProps {
  links?: Array<{
    href: string
    text: string
  }>
}

export function SkipNavigation({ links }: SkipNavigationProps) {
  const defaultLinks = [
    createSkipLink('main-content', 'Skip to main content'),
    createSkipLink('navigation', 'Skip to navigation'),
    createSkipLink('search', 'Skip to search'),
    createSkipLink('footer', 'Skip to footer')
  ]

  const skipLinks = links || defaultLinks

  return (
    <div className="skip-navigation">
      {skipLinks.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className={link.className || 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'}
        >
          {link.text}
        </Link>
      ))}
    </div>
  )
}