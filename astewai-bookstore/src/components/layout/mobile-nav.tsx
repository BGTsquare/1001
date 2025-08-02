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
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sheet-mobile w-[320px] sm:w-[400px] safe-area-right">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b touch-target">
            <Link href={ROUTES.HOME} onClick={closeNav}>
              <span className="text-mobile-lg font-bold">{APP_NAME}</span>
            </Link>
          </div>

          <nav className="flex flex-col space-mobile-tight mt-6">
            <Link
              href={ROUTES.BOOKS}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              Books
            </Link>
            <Link
              href={ROUTES.BUNDLES}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              Bundles
            </Link>
            <Link
              href={ROUTES.BLOG}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              Blog
            </Link>
            <Link
              href={ROUTES.CONTACT}
              onClick={closeNav}
              className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              Contact
            </Link>

            {user && (
              <>
                <div className="border-t pt-4 mt-4">
                  <Link
                    href={ROUTES.LIBRARY}
                    onClick={closeNav}
                    className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    My Library
                  </Link>
                  <Link
                    href={ROUTES.PROFILE}
                    onClick={closeNav}
                    className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
                  >
                    Profile
                  </Link>
                  
                  {profile?.role === 'admin' && (
                    <Link
                      href={ROUTES.ADMIN.DASHBOARD}
                      onClick={closeNav}
                      className="mobile-nav-item hover:bg-accent hover:text-accent-foreground rounded-md"
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
              <div className="space-mobile-normal">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-mobile-sm font-medium">
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
                  className="w-full button-mobile"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-mobile-tight">
                <Link href={ROUTES.AUTH.LOGIN} onClick={closeNav}>
                  <Button variant="outline" className="w-full button-mobile">
                    Sign In
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER} onClick={closeNav}>
                  <Button className="w-full button-mobile">
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