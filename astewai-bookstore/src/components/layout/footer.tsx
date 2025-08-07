import Link from 'next/link';
import { APP_NAME } from '@/utils/constants';

export function Footer() {
  return (
    <footer 
      className="border-t bg-background safe-area-bottom" 
      role="contentinfo"
      id="footer"
    >
      <div className="container-mobile py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1 space-mobile-normal">
            <h3 className="text-mobile-lg font-semibold">{APP_NAME}</h3>
            <p className="text-mobile-sm text-muted-foreground">
              Your digital library for discovering, purchasing, and reading
              books online.
            </p>
          </div>

          <nav className="space-mobile-normal" aria-labelledby="browse-heading">
            <h4 id="browse-heading" className="text-mobile-sm font-semibold">Browse</h4>
            <ul className="space-mobile-tight text-mobile-sm" role="list">
              <li>
                <Link
                  href="/books"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  All Books
                </Link>
              </li>
              <li>
                <Link
                  href="/bundles"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Book Bundles
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="space-mobile-normal" aria-labelledby="account-heading">
            <h4 id="account-heading" className="text-mobile-sm font-semibold">Account</h4>
            <ul className="space-mobile-tight text-mobile-sm" role="list">
              <li>
                <Link
                  href="/library"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  My Library
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="space-mobile-normal" aria-labelledby="support-heading">
            <h4 id="support-heading" className="text-mobile-sm font-semibold">Support</h4>
            <ul className="space-mobile-tight text-mobile-sm" role="list">
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="space-mobile-normal" aria-labelledby="legal-heading">
            <h4 id="legal-heading" className="text-mobile-sm font-semibold">Legal</h4>
            <ul className="space-mobile-tight text-mobile-sm" role="list">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-mobile-xs sm:text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
