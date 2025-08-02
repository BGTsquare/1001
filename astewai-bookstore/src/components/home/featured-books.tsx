'use client';

import { useQuery } from '@tanstack/react-query';
import { BookCard } from '@/components/books';
import { clientBookService } from '@/lib/services/client-book-service';

export function FeaturedBooks() {
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['books', 'featured'],
    queryFn: () => clientBookService.searchBooks({ limit: 6, sortBy: 'created_at', sortOrder: 'desc' }),
  });

  const books = result?.success ? result.data?.books : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-64 mb-4"></div>
            <div className="bg-muted rounded h-4 mb-2"></div>
            <div className="bg-muted rounded h-3 w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load featured books</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No featured books available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}