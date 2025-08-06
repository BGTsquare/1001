/**
 * Analytics Tracking Examples
 * Demonstrates how to use analytics hooks in components
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useAnalytics, 
  useFormTracking, 
  useSearchTracking, 
  useReadingTracking,
  useInteractionTracking 
} from '@/lib/analytics/hooks';
import { analyticsConfig } from '@/lib/analytics/config';

// Example: Book Card with Analytics
interface BookCardWithAnalyticsProps {
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
  };
}

export function BookCardWithAnalytics({ book }: BookCardWithAnalyticsProps) {
  const { track, trackConversion } = useAnalytics();

  // Track book view when component mounts
  const trackBookView = useInteractionTracking(
    analyticsConfig.events.BOOK_VIEW,
    {
      book_id: book.id,
      book_title: book.title,
      book_author: book.author,
      book_price: book.price,
    },
    { trackOnMount: true }
  );

  const handlePurchaseClick = () => {
    // Track purchase initiation
    trackConversion(analyticsConfig.events.PURCHASE_INITIATED, {
      item_id: book.id,
      item_name: book.title,
      value: book.price,
      currency: 'USD',
      category: 'book',
    });
  };

  const handlePreviewClick = () => {
    track(analyticsConfig.events.BOOK_PREVIEW, {
      book_id: book.id,
      book_title: book.title,
    });
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{book.title}</CardTitle>
        <CardDescription>by {book.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">${book.price}</span>
          <div className="space-x-2">
            <Button variant="outline" onClick={handlePreviewClick}>
              Preview
            </Button>
            <Button onClick={handlePurchaseClick}>
              Buy Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Example: Search Component with Analytics
export function SearchWithAnalytics() {
  const { trackSearch, trackSearchFilter } = useSearchTracking();

  const handleSearch = (query: string) => {
    // This would typically be called from a search input with debouncing
    trackSearch(query, { category: 'all' }, 42); // 42 results found
  };

  const handleFilterChange = (filterType: string, value: string) => {
    trackSearchFilter(filterType, value);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search books..."
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => handleFilterChange('category', 'fiction')}
        >
          Fiction
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleFilterChange('price', 'under-20')}
        >
          Under $20
        </Button>
      </div>
    </div>
  );
}

// Example: Reading Component with Analytics
interface ReadingComponentProps {
  bookId: string;
  bookTitle: string;
}

export function ReadingComponentWithAnalytics({ bookId, bookTitle }: ReadingComponentProps) {
  const { trackBookOpen, trackReadingProgress, trackBookCompleted } = useReadingTracking(bookId, bookTitle);

  useEffect(() => {
    // Track when user opens the book
    trackBookOpen();
  }, [trackBookOpen]);

  const handleProgressUpdate = (progress: number) => {
    trackReadingProgress(progress);
    
    // Track completion
    if (progress >= 100) {
      trackBookCompleted();
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{bookTitle}</h1>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Reading Progress</span>
          <span>75%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: '75%' }}
          />
        </div>
      </div>
      <Button onClick={() => handleProgressUpdate(100)}>
        Mark as Complete
      </Button>
    </div>
  );
}

// Example: Form with Analytics
export function ContactFormWithAnalytics() {
  const { trackFormStart, trackFormSubmit, trackFieldInteraction } = useFormTracking('contact');

  useEffect(() => {
    trackFormStart();
  }, [trackFormStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      trackFormSubmit(true);
    } catch (error) {
      trackFormSubmit(false, ['Submission failed']);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full p-2 border rounded"
          onFocus={() => trackFieldInteraction('name', 'focus')}
          onBlur={() => trackFieldInteraction('name', 'blur')}
          onChange={() => trackFieldInteraction('name', 'change')}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full p-2 border rounded"
          onFocus={() => trackFieldInteraction('email', 'focus')}
          onBlur={() => trackFieldInteraction('email', 'blur')}
          onChange={() => trackFieldInteraction('email', 'change')}
        />
      </div>
      <Button type="submit">
        Submit
      </Button>
    </form>
  );
}

// Example: User Authentication with Analytics
export function AuthWithAnalytics() {
  const { track } = useAnalytics();

  const handleLogin = () => {
    track(analyticsConfig.events.USER_LOGIN, {
      method: 'email',
      timestamp: new Date().toISOString(),
    });
  };

  const handleSignup = () => {
    track(analyticsConfig.events.USER_SIGNUP, {
      method: 'email',
      timestamp: new Date().toISOString(),
    });
  };

  const handleLogout = () => {
    track(analyticsConfig.events.USER_LOGOUT, {
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-x-2">
      <Button onClick={handleLogin}>Login</Button>
      <Button onClick={handleSignup}>Sign Up</Button>
      <Button variant="outline" onClick={handleLogout}>Logout</Button>
    </div>
  );
}