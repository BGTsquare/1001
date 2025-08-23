import { bundleService } from '@/lib/services/bundle-service'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

export interface CreateBundleWithBooksData {
  title: string
  description?: string
  price: number
  cover_image_url?: string
  books: BookInsert[]
}

export interface CommandResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Array<{ field: string; message: string }>
}

export class CreateBundleWithBooksCommand {
  private supabase: any
  private createdBookIds: string[] = []

  constructor() {
    this.supabase = null
  }

  async execute(data: CreateBundleWithBooksData): Promise<CommandResult<any>> {
    try {
      this.supabase = await createClient()
      
      // Validate input data
      const validationResult = this.validateInput(data)
      if (!validationResult.success) {
        return validationResult
      }

      // Create books first
      const booksResult = await this.createBooks(data.books)
      if (!booksResult.success) {
        return booksResult
      }

      // Create bundle with the created book IDs
      const bundleResult = await this.createBundle({
        title: data.title,
        description: data.description,
        price: data.price,
        cover_image_url: data.cover_image_url,
        bookIds: this.createdBookIds
      })

      if (!bundleResult.success) {
        // Cleanup created books on bundle creation failure
        await this.cleanup()
        return bundleResult
      }

      return bundleResult
    } catch (error) {
      console.error('Error in CreateBundleWithBooksCommand:', error)
      await this.cleanup()
      return {
        success: false,
        error: 'An unexpected error occurred while creating bundle with books'
      }
    }
  }

  private validateInput(data: CreateBundleWithBooksData): CommandResult<null> {
    const errors: Array<{ field: string; message: string }> = []

    if (!data.title?.trim()) {
      errors.push({ field: 'title', message: 'Title is required' })
    }

    if (typeof data.price !== 'number' || data.price < 0) {
      errors.push({ field: 'price', message: 'Valid price is required' })
    }

    if (!data.books || !Array.isArray(data.books) || data.books.length === 0) {
      errors.push({ field: 'books', message: 'At least one book is required' })
    } else {
      // Validate each book
      data.books.forEach((book, index) => {
        if (!book.title?.trim()) {
          errors.push({ field: `books[${index}].title`, message: 'Book title is required' })
        }
        if (!book.author?.trim()) {
          errors.push({ field: `books[${index}].author`, message: 'Book author is required' })
        }
        if (!book.cover_image_url?.trim()) {
          errors.push({ field: `books[${index}].cover_image_url`, message: 'Book cover image URL is required' })
        }
        if (!book.content_url?.trim()) {
          errors.push({ field: `books[${index}].content_url`, message: 'Book content URL is required' })
        }
      })
    }

    return {
      success: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  private async createBooks(books: BookInsert[]): Promise<CommandResult<any>> {
    try {
      // Mark books as bundle-only so they don't appear in the main catalog
      const booksWithBundleFlag = books.map(book => ({
        ...book,
        bundle_only: true
      }))

      const { data: createdBooks, error } = await this.supabase
        .from('books')
        .insert(booksWithBundleFlag)
        .select('id, title, author, price')

      if (error || !createdBooks) {
        console.error('Error creating books:', error)
        return {
          success: false,
          error: 'Failed to create books'
        }
      }

      this.createdBookIds = createdBooks.map(book => book.id)
      return {
        success: true,
        data: createdBooks
      }
    } catch (error) {
      console.error('Error in createBooks:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while creating books'
      }
    }
  }

  private async createBundle(bundleData: {
    title: string
    description?: string
    price: number
    cover_image_url?: string
    bookIds: string[]
  }): Promise<CommandResult<any>> {
    return await bundleService.createBundle(bundleData)
  }

  private async cleanup(): Promise<void> {
    if (this.createdBookIds.length > 0) {
      try {
        await this.supabase
          .from('books')
          .delete()
          .in('id', this.createdBookIds)
        
        console.log(`Cleaned up ${this.createdBookIds.length} books`)
      } catch (error) {
        console.error('Error during cleanup:', error)
      }
    }
  }
}