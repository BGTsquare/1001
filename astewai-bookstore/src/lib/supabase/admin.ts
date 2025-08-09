import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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