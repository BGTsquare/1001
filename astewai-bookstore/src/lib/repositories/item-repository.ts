import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/lib/types/result'
import { success, failure } from '@/lib/types/result'

export interface ItemEntity {
  id: string
  title: string
  price: number
}

export class ItemRepository {
  private supabase = createClient()

  async findBook(bookId: string): Promise<Result<ItemEntity | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('id, title, price')
        .eq('id', bookId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(null)
        }
        return failure(`Failed to find book: ${error.message}`)
      }

      return success(data)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findBundle(bundleId: string): Promise<Result<ItemEntity | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('bundles')
        .select('id, title, price')
        .eq('id', bundleId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return success(null)
        }
        return failure(`Failed to find bundle: ${error.message}`)
      }

      return success(data)
    } catch (error) {
      return failure(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findItem(itemType: 'book' | 'bundle', itemId: string): Promise<Result<ItemEntity | null, string>> {
    if (itemType === 'book') {
      return this.findBook(itemId)
    } else {
      return this.findBundle(itemId)
    }
  }
}