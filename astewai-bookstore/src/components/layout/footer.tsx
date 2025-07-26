import Link from 'next/link';
import { APP_NAME } from '@/utils/constants';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              Your digital library for discovering, purchasing, and reading
              books online.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/books"
                  className="text-muted-foreground hover:text-foreground"
                >
                  All Books
                </Link>
              </li>
              <li>
                <Link
                  href="/bundles"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Book Bundles
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/library"
                  className="text-muted-foreground hover:text-foreground"
                >
                  My Library
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
