import { createClient } from '@/lib/supabase/server'
/**
 * @deprecated This file is deprecated. Use the new DatabaseService instead.
 * Import from '@/lib/services/database-service' for new code.
 * 
 * This file is kept for backward compatibility but will be removed in a future version.
 * All functions now delegate to the DatabaseService.
 */

import { databaseService } from '@/lib/services/database-service'
import type { Bundle, BlogPost, UserLibrary, Purchase } from '@/types'

// Book operations
export async function getBooks(filters?: {
  category?: string
  search?: string
  isFree?: boolean
  limit?: number
  offset?: number
}) {
  return await databaseService.getBooks(filters)
}

export async function getBookById(id: string) {
  return await databaseService.getBookById(id)
}

// Bundle operations
export async function getBundles() {
  return await databaseService.getBundles()
}

export async function getBundleById(id: string) {
  return await databaseService.getBundleById(id)
}

// Blog operations
export async function getBlogPosts(filters?: {
  category?: string
  published?: boolean
  limit?: number
  offset?: number
}) {
  return await databaseService.getBlogPosts(filters)
}

export async function getBlogPostById(id: string) {
  return await databaseService.getBlogPostById(id)
}

// User library operations
export async function getUserLibrary(userId: string, status?: 'owned' | 'pending' | 'completed') {
  return await databaseService.getUserLibrary(userId, status)
}

export async function addToLibrary(userId: string, bookId: string, status: 'owned' | 'pending' = 'owned') {
  return await databaseService.addToLibrary(userId, bookId, status)
}

export async function updateReadingProgress(userId: string, bookId: string, progress: number, position?: string) {
  return await databaseService.updateReadingProgress(userId, bookId, progress, position)
}

// Purchase operations
export async function createPurchase(userId: string, itemType: 'book' | 'bundle', itemId: string, amount: number) {
  return await databaseService.createPurchase(userId, itemType, itemId, amount)
}

export async function getUserPurchases(userId: string) {
  return await databaseService.getUserPurchases(userId)
}