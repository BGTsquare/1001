import { createClient } from '@/lib/supabase/server';
import { bookService } from '@/lib/services/book-service';
import { libraryService } from '@/lib/services/library-service';

export interface ProcessedContent {
  content: string;
  contentFormat: 'pdf' | 'epub' | 'text';
}

export interface BookContentResponse {
  success: boolean;
  content: string;
  contentFormat: 'pdf' | 'epub' | 'text';
  book: {
    id: string;
    title: string;
    author: string;
  };
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class BookContentService {
  /**
   * Content processing utilities
   */
  private escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match] || match));
  }

  private getFileExtension(url: string): string | undefined {
    return url.split('.').pop()?.toLowerCase();
  }

  private createDownloadNotice(bookId: string, format: 'PDF' | 'EPUB' | 'Unknown Format'): string {
    return `
      <div class="${format.toLowerCase().replace(' ', '-')}-content-notice">
        <h2>${format} Content</h2>
        <p>This book is in ${format} format. You can download it to read with your preferred ${format} viewer.</p>
        <a href="/api/books/${bookId}/download" class="download-link" target="_blank">
          Download ${format}
        </a>
      </div>
    `;
  }

  private wrapPlainTextContent(content: string, title: string, author: string): string {
    const escapedTitle = this.escapeHtml(title);
    const escapedAuthor = this.escapeHtml(author);
    const escapedContent = this.escapeHtml(content);
    
    return `
      <div class="book-content">
        <header class="book-header mb-8">
          <h1 class="text-3xl font-bold mb-2">${escapedTitle}</h1>
          <p class="text-xl text-muted-foreground mb-4">by ${escapedAuthor}</p>
          <hr class="border-t-2 border-primary/20" />
        </header>
        <div class="book-body whitespace-pre-wrap">
          ${escapedContent}
        </div>
      </div>
    `;
  }

  /**
   * Markdown conversion rules for better maintainability
   */
  private readonly MARKDOWN_RULES = [
    // Headers (order matters - process larger headers first)
    { pattern: /^### (.*$)/gm, replacement: '<h3 class="text-xl font-semibold mb-3 mt-6">$1</h3>' },
    { pattern: /^## (.*$)/gm, replacement: '<h2 class="text-2xl font-semibold mb-4 mt-8">$1</h2>' },
    { pattern: /^# (.*$)/gm, replacement: '<h1 class="text-3xl font-bold mb-6 mt-10">$1</h1>' },
    // Text formatting
    { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
    { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
    // Links
    { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" class="text-primary hover:underline" target="_blank">$1</a>' },
    // Blockquotes
    { pattern: /^> (.*$)/gm, replacement: '<blockquote class="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">$1</blockquote>' },
    // Lists
    { pattern: /^- (.*$)/gm, replacement: '<li class="mb-1">$1</li>' },
    { pattern: /(<li.*<\/li>)/g, replacement: '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>' },
    // Paragraphs
    { pattern: /\n\n/g, replacement: '</p><p class="mb-4">' },
    { pattern: /^(.+)$/gm, replacement: '<p class="mb-4">$1</p>' },
    // Cleanup
    { pattern: /<p class="mb-4"><\/p>/g, replacement: '' }
  ] as const;

  private convertMarkdownToHtml(markdown: string): string {
    return this.MARKDOWN_RULES.reduce(
      (content, rule) => content.replace(rule.pattern, rule.replacement),
      markdown
    );
  }

  /**
   * Authenticate and authorize user for book access
   */
  async authenticateAndAuthorize(bookId: string): Promise<ServiceResult<{
    user: any;
    book: any;
    supabase: any;
  }>> {
    try {
      const supabase = await createClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { 
          success: false, 
          error: 'Authentication required', 
          status: 401 
        };
      }

      // Get book details
      const bookResult = await bookService.getBookById(bookId);
      if (!bookResult.success || !bookResult.data) {
        return { 
          success: false, 
          error: 'Book not found', 
          status: 404 
        };
      }

      const book = bookResult.data;

      // Check if user owns the book or if it's free
      if (!book.is_free) {
        const ownershipResult = await libraryService.checkBookOwnership(user.id, bookId);
        if (!ownershipResult.success || !ownershipResult.data?.owned) {
          return { 
            success: false, 
            error: 'You do not own this book', 
            status: 403 
          };
        }
      }

      return {
        success: true,
        data: { user, book, supabase }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Internal server error',
        status: 500
      };
    }
  }

  /**
   * Fetch book content from storage
   */
  async fetchBookContent(supabase: any, contentUrl: string): Promise<ServiceResult<{
    contentData: Blob;
    filePath: string;
  }>> {
    try {
      let filePath = contentUrl;
      console.log('Original content_url:', contentUrl);
      
      if (filePath.includes('/storage/v1/object/')) {
        const parts = filePath.split('/book-content/');
        if (parts.length > 1) {
          filePath = parts[1];
        }
      }
      
      console.log('Extracted file path:', filePath);

      const { data: contentData, error: storageError } = await supabase.storage
        .from('book-content')
        .download(filePath);

      if (storageError || !contentData) {
        console.error('Storage error:', storageError);
        return {
          success: false,
          error: 'Failed to load book content',
          status: 500
        };
      }

      return {
        success: true,
        data: { contentData, filePath }
      };
    } catch (error) {
      console.error('Content fetch error:', error);
      return {
        success: false,
        error: 'Failed to fetch book content',
        status: 500
      };
    }
  }

  /**
   * Process book content based on type
   */
  async processBookContent(
    contentData: Blob, 
    contentUrl: string, 
    bookId: string,
    bookTitle: string,
    bookAuthor: string
  ): Promise<ProcessedContent> {
    const fileExtension = this.getFileExtension(contentUrl);
    const contentType = contentData.type;

    console.log('Processing content:', { fileExtension, contentType, contentUrl });

    // Try to read as text first, regardless of extension
    try {
      let content = await contentData.text();
      
      // If we successfully read text content and it's not empty/binary
      if (content && content.length > 0 && !content.includes('\0')) {
        // Handle different text formats
        if (fileExtension === 'md' || fileExtension === 'markdown') {
          // Convert markdown to HTML
          const htmlContent = this.convertMarkdownToHtml(content);
          content = `
            <div class="book-content">
              <header class="book-header mb-8">
                <h1 class="text-3xl font-bold mb-2">${this.escapeHtml(bookTitle)}</h1>
                <p class="text-xl text-muted-foreground mb-4">by ${this.escapeHtml(bookAuthor)}</p>
                <hr class="border-t-2 border-primary/20" />
              </header>
              <div class="book-body prose prose-lg max-w-none">
                ${htmlContent}
              </div>
            </div>
          `;
        } else if (contentType === 'text/plain' || fileExtension === 'txt' || !content.includes('<')) {
          // Wrap plain text in HTML structure
          content = this.wrapPlainTextContent(content, bookTitle, bookAuthor);
        }

        return {
          content,
          contentFormat: 'text'
        };
      }
    } catch (error) {
      console.log('Failed to read as text, treating as binary file:', error);
    }

    // Handle PDF files (fallback for binary PDFs)
    if (contentType === 'application/pdf' || fileExtension === 'pdf') {
      return {
        content: this.createDownloadNotice(bookId, 'PDF'),
        contentFormat: 'pdf'
      };
    }

    // Handle EPUB files (fallback for binary EPUBs)
    if (contentType === 'application/epub+zip' || fileExtension === 'epub') {
      return {
        content: this.createDownloadNotice(bookId, 'EPUB'),
        contentFormat: 'epub'
      };
    }

    // Fallback: try to display as text anyway
    try {
      const content = await contentData.text();
      return {
        content: this.wrapPlainTextContent(content, bookTitle, bookAuthor),
        contentFormat: 'text'
      };
    } catch (error) {
      return {
        content: this.createDownloadNotice(bookId, 'Unknown Format'),
        contentFormat: 'pdf'
      };
    }
  }

  /**
   * Get book content for reading
   */
  async getBookContent(bookId: string): Promise<ServiceResult<BookContentResponse>> {
    try {
      // Authenticate and authorize user
      const authResult = await this.authenticateAndAuthorize(bookId);
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
          status: authResult.status
        };
      }

      const { book, supabase } = authResult.data!;

      // Check if book has content
      if (!book.content_url) {
        return {
          success: false,
          error: 'Book content not available',
          status: 404
        };
      }

      // Fetch book content from storage
      const contentResult = await this.fetchBookContent(supabase, book.content_url);
      if (!contentResult.success) {
        return {
          success: false,
          error: contentResult.error,
          status: contentResult.status
        };
      }

      const { contentData, filePath } = contentResult.data!;

      // Process book content based on type
      const { content, contentFormat } = await this.processBookContent(
        contentData,
        filePath,
        book.id,
        book.title,
        book.author
      );

      return {
        success: true,
        data: {
          success: true,
          content,
          contentFormat,
          book: {
            id: book.id,
            title: book.title,
            author: book.author
          }
        }
      };
    } catch (error) {
      console.error('Error getting book content:', error);
      return {
        success: false,
        error: 'Internal server error',
        status: 500
      };
    }
  }
}

export const bookContentService = new BookContentService();