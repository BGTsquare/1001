import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set in environment')
}

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Helper function to verify admin client is properly configured
export async function verifyAdminClient() {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
    if (error) {
      console.error('Admin client verification failed:', error)
      return false
    }
    console.log('Admin client verified. Available buckets:', buckets.map(b => b.id))
    return true
  } catch (error) {
    console.error('Admin client verification error:', error)
    return false
  }
}