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
    <header
      className="sticky top-0 z-50 glass-header border-b border-glass-border safe-area-top"
      role="banner"
    >
      <div className="container-mobile flex h-16 sm:h-18 items-center justify-between">
        <div className="flex items-center space-x-6 sm:space-x-8">
          <Link
            href={ROUTES.HOME}
            className="flex items-center space-x-2 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-2 py-1 hover-glow transition-all duration-300"
            aria-label={`${APP_NAME} - Go to homepage`}
          >
            <span className="text-mobile-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Main navigation"
            id="navigation"
          >
            <Link
              href={ROUTES.BOOKS}
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-3 py-2 relative group"
            >
              Books
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
            <Link
              href={ROUTES.BUNDLES}
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-3 py-2 relative group"
            >
              Bundles
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
            <Link
              href={ROUTES.BLOG}
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-3 py-2 relative group"
            >
              Blog
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
            <Link
              href={ROUTES.CONTACT}
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-3 py-2 relative group"
            >
              Contact
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4" role="navigation" aria-label="User navigation">
            {user ? (
              <>
                <Link href={ROUTES.LIBRARY}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Go to my library"
                  >
                    My Library
                  </Button>
                </Link>
                
                {/* Admin Dashboard Link - Only show for admin users */}
                {profile?.role === 'admin' && (
                  <Link href={ROUTES.ADMIN.DASHBOARD}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label="Go to admin dashboard"
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                
                {/* Profile dropdown or link */}
                <div className="flex items-center space-x-2">
                  <Link href={ROUTES.PROFILE}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center space-x-2 touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label={`Go to profile for ${profile?.display_name || 'user'}`}
                    >
                      <div 
                        className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium"
                        aria-hidden="true"
                      >
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
                    className="touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Sign out of your account"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href={ROUTES.AUTH.LOGIN}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER}>
                  <Button 
                    size="sm" 
                    className="touch-target focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </Button>
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
