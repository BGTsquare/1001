'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { ROUTES, APP_NAME } from '@/utils/constants';
import { useAuth } from '@/contexts/auth-context';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const closeNav = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="sheet-mobile w-[320px] sm:w-[400px] safe-area-right"
        aria-labelledby="mobile-nav-title"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b touch-target">
            <Link 
              href={ROUTES.HOME} 
              onClick={closeNav}
              className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              aria-label={`${APP_NAME} - Go to homepage`}
            >
              <span id="mobile-nav-title" className="text-mobile-lg font-bold">{APP_NAME}</span>
            </Link>
          </div>

          <nav 
            id="mobile-navigation"
            className="flex flex-col space-mobile-tight mt-6" 
            role="navigation" 
            aria-label="Mobile navigation"
          >
            <Link
              href={ROUTES.BOOKS}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Books
            </Link>
            <Link
              href={ROUTES.BUNDLES}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Bundles
            </Link>
            <Link
              href={ROUTES.BLOG}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Blog
            </Link>
            <Link
              href={ROUTES.CONTACT}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Contact
            </Link>

            {user && (
              <>
                <div className="border-t pt-4 mt-4" role="group" aria-label="User account navigation">
                  <Link
                    href={ROUTES.LIBRARY}
                    onClick={closeNav}
                    className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    My Library
                  </Link>
                  <Link
                    href={ROUTES.PROFILE}
                    onClick={closeNav}
                    className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Profile
                  </Link>
                  
                  {profile?.role === 'admin' && (
                    <Link
                      href={ROUTES.ADMIN.DASHBOARD}
                      onClick={closeNav}
                      className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t safe-area-bottom">
            {user ? (
              <div className="space-mobile-normal" role="group" aria-label="User account actions">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div 
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-mobile-sm font-medium"
                    aria-hidden="true"
                  >
                    {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-mobile-sm font-medium truncate">
                      {profile?.display_name || 'User'}
                    </p>
                    <p className="text-mobile-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full button-mobile focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Sign out of your account"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-mobile-tight" role="group" aria-label="Authentication actions">
                <Link href={ROUTES.AUTH.LOGIN} onClick={closeNav}>
                  <Button 
                    variant="outline" 
                    className="w-full button-mobile focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER} onClick={closeNav}>
                  <Button 
                    className="w-full button-mobile focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}