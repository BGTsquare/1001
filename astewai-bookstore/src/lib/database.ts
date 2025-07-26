import { createClient } from '@/lib/supabase/server'
import type { Bundle, BlogPost, UserLibrary, Purchase } from '@/types'
import { bookRepository } from '@/lib/books'

// Book operations - using the new book repository
export async function getBooks(filters?: {
  category?: string
  search?: string
  isFree?: boolean
  limit?: number
  offset?: number
}) {
  return await bookRepository.getAll({
    category: filters?.category,
    query: filters?.search,
    isFree: filters?.isFree,
    limit: filters?.limit,
    offset: filters?.offset
  })
}

export async function getBookById(id: string) {
  return await bookRepository.getById(id)
}

// Bundle operations
export async function getBundles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      *,
      bundle_books (
        books (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bundles:', error)
    return []
  }

  // Transform the data to match our Bundle type
  return data.map(bundle => ({
    ...bundle,
    books: bundle.bundle_books.map((bb: any) => bb.books)
  })) as Bundle[]
}

export async function getBundleById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      *,
      bundle_books (
        books (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching bundle:', error)
    return null
  }

  return {
    ...data,
    books: data.bundle_books.map((bb: any) => bb.books)
  } as Bundle
}

// Blog operations
export async function getBlogPosts(filters?: {
  category?: string
  published?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  let query = supabase.from('blog_posts').select('*')

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.published !== undefined) {
    query = query.eq('published', filters.published)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }

  return data as BlogPost[]
}

export async function getBlogPostById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching blog post:', error)
    return null
  }

  return data as BlogPost
}

// User library operations
export async function getUserLibrary(userId: string, status?: 'owned' | 'pending' | 'completed') {
  const supabase = await createClient()
  let query = supabase
    .from('user_library')
    .select(`
      *,
      books (*)
    `)
    .eq('user_id', userId)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.order('added_at', { ascending: false })

  if (error) {
    console.error('Error fetching user library:', error)
    return []
  }

  return data.map(item => ({
    ...item,
    book: item.books
  })) as UserLibrary[]
}

export async function addToLibrary(userId: string, bookId: string, status: 'owned' | 'pending' = 'owned') {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_library')
    .insert({
      user_id: userId,
      book_id: bookId,
      status
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding to library:', error)
    return null
  }

  return data
}

export async function updateReadingProgress(userId: string, bookId: string, progress: number, position?: string) {
  const supabase = await createClient()
  const updateData: any = { progress }
  
  if (position) {
    updateData.last_read_position = position
  }

  if (progress >= 100) {
    updateData.status = 'completed'
  }

  const { data, error } = await supabase
    .from('user_library')
    .update(updateData)
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select()
    .single()

  if (error) {
    console.error('Error updating reading progress:', error)
    return null
  }

  return data
}

// Purchase operations
export async function createPurchase(userId: string, itemType: 'book' | 'bundle', itemId: string, amount: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      amount,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating purchase:', error)
    return null
  }

  return data as Purchase
}

export async function getUserPurchases(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user purchases:', error)
    return []
  }

  return data as Purchase[]
}