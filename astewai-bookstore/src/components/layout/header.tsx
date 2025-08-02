'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES, APP_NAME } from '@/utils/constants';
import { useAuth } from '@/contexts/auth-context';
import { MobileNav } from './mobile-nav';

export function Header() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
      <div className="container-mobile flex h-14 sm:h-16 items-center justify-between">
        <div className="flex items-center space-x-4 sm:space-x-8">
          <Link href={ROUTES.HOME} className="flex items-center space-x-2 touch-target">
            <span className="text-mobile-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none">{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href={ROUTES.BOOKS}
              className="text-sm font-medium transition-colors hover:text-primary touch-target"
            >
              Books
            </Link>
            <Link
              href={ROUTES.BUNDLES}
              className="text-sm font-medium transition-colors hover:text-primary touch-target"
            >
              Bundles
            </Link>
            <Link
              href={ROUTES.BLOG}
              className="text-sm font-medium transition-colors hover:text-primary touch-target"
            >
              Blog
            </Link>
            <Link
              href={ROUTES.CONTACT}
              className="text-sm font-medium transition-colors hover:text-primary touch-target"
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href={ROUTES.LIBRARY}>
                  <Button variant="ghost" size="sm" className="touch-target">
                    My Library
                  </Button>
                </Link>
                
                {/* Admin Dashboard Link - Only show for admin users */}
                {profile?.role === 'admin' && (
                  <Link href={ROUTES.ADMIN.DASHBOARD}>
                    <Button variant="ghost" size="sm" className="touch-target">
                      Admin
                    </Button>
                  </Link>
                )}
                
                {/* Profile dropdown or link */}
                <div className="flex items-center space-x-2">
                  <Link href={ROUTES.PROFILE}>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 touch-target">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="hidden lg:inline">
                        {profile?.display_name || 'Profile'}
                      </span>
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="touch-target"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href={ROUTES.AUTH.LOGIN}>
                  <Button variant="outline" size="sm" className="touch-target">
                    Sign In
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER}>
                  <Button size="sm" className="touch-target">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
