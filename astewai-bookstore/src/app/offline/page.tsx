'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home, Book } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="container-mobile min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="heading-responsive-lg">You're Offline</CardTitle>
          <CardDescription className="text-mobile-base">
            It looks like you've lost your internet connection. Don't worry, you can still access some features.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-mobile-lg">What you can do offline:</h3>
            <ul className="text-left space-y-2 text-mobile-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Book className="h-4 w-4 flex-shrink-0" />
                Continue reading downloaded books
              </li>
              <li className="flex items-center gap-2">
                <Book className="h-4 w-4 flex-shrink-0" />
                View your library (cached books)
              </li>
              <li className="flex items-center gap-2">
                <Book className="h-4 w-4 flex-shrink-0" />
                Browse previously viewed content
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full button-mobile"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full button-mobile">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            
            <Link href="/library" className="block">
              <Button variant="outline" className="w-full button-mobile">
                <Book className="h-4 w-4 mr-2" />
                View Library
              </Button>
            </Link>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-mobile-xs text-muted-foreground">
              Your reading progress is automatically saved and will sync when you're back online.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}