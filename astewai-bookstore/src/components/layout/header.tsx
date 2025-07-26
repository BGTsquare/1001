'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES, APP_NAME } from '@/utils/constants';
import { useAuth } from '@/contexts/auth-context';

export function Header() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href={ROUTES.BOOKS}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Books
            </Link>
            <Link
              href={ROUTES.BUNDLES}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Bundles
            </Link>
            <Link
              href={ROUTES.BLOG}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Blog
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href={ROUTES.LIBRARY}>
                <Button variant="ghost" size="sm">
                  My Library
                </Button>
              </Link>
              
              {/* Profile dropdown or link */}
              <div className="flex items-center space-x-2">
                <Link href={ROUTES.PROFILE}>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
                      {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline">
                      {profile?.display_name || 'Profile'}
                    </span>
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href={ROUTES.AUTH.LOGIN}>
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href={ROUTES.AUTH.REGISTER}>
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
