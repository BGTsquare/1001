import { BookGrid } from '@/components/books'

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Books</h1>
        <p className="text-muted-foreground">
          Discover and browse our collection of digital books
        </p>
      </div>
      
      <BookGrid />
    </div>
  );
}
