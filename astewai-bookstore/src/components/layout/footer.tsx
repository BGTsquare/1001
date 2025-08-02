import Link from 'next/link';
import { APP_NAME } from '@/utils/constants';

export function Footer() {
  return (
    <footer className="border-t bg-background safe-area-bottom">
      <div className="container-mobile py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1 space-mobile-normal">
            <h3 className="text-mobile-lg font-semibold">{APP_NAME}</h3>
            <p className="text-mobile-sm text-muted-foreground">
              Your digital library for discovering, purchasing, and reading
              books online.
            </p>
          </div>

          <div className="space-mobile-normal">
            <h4 className="text-mobile-sm font-semibold">Browse</h4>
            <ul className="space-mobile-tight text-mobile-sm">
              <li>
                <Link
                  href="/books"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  All Books
                </Link>
              </li>
              <li>
                <Link
                  href="/bundles"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Book Bundles
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-mobile-normal">
            <h4 className="text-mobile-sm font-semibold">Account</h4>
            <ul className="space-mobile-tight text-mobile-sm">
              <li>
                <Link
                  href="/library"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  My Library
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-mobile-normal">
            <h4 className="text-mobile-sm font-semibold">Support</h4>
            <ul className="space-mobile-tight text-mobile-sm">
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground touch-target inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-mobile-xs sm:text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
