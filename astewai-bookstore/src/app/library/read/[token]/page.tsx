import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookReader } from '@/components/library/book-reader'

interface PageProps {
  params: {
    token: string
  }
}

export default async function SecureReadingPage({ params }: PageProps) {
  const { token } = params
  const supabase = await createClient()

  // Verify the reading token
  const { data: readingToken, error: tokenError } = await supabase
    .from('reading_tokens')
    .select(`
      id,
      purchase_id,
      item_id,
      item_type,
      expires_at,
      used_at,
      purchases!inner (
        id,
        user_id,
        item_title,
        status
      )
    `)
    .eq('token', token)
    .single()

  if (tokenError || !readingToken) {
    notFound()
  }

  // Check if token has expired
  if (new Date(readingToken.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600 mb-4">
            This reading link has expired. Please contact support if you need access to your book.
          </p>
          <a 
            href="/library" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Library
          </a>
        </div>
      </div>
    )
  }

  // Check if purchase is completed
  if (readingToken.purchases.status !== 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-yellow-500 text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Pending</h1>
          <p className="text-gray-600 mb-4">
            Your purchase is still being processed. You'll receive access once payment is verified.
          </p>
          <a 
            href="/library" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Library
          </a>
        </div>
      </div>
    )
  }

  // Get the current user to verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.id !== readingToken.purchases.user_id) {
    redirect('/auth/login?redirect=' + encodeURIComponent(`/library/read/${token}`))
  }

  // Mark token as used (first time access)
  if (!readingToken.used_at) {
    await supabase
      .from('reading_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', readingToken.id)
  }

  // Get the book/bundle content
  let content = null
  if (readingToken.item_type === 'book') {
    const { data: book } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        description,
        cover_image_url,
        content_url,
        file_size,
        page_count
      `)
      .eq('id', readingToken.item_id)
      .single()
    
    content = book
  } else if (readingToken.item_type === 'bundle') {
    const { data: bundle } = await supabase
      .from('bundles')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        bundle_books!inner (
          books (
            id,
            title,
            author,
            description,
            cover_image_url,
            content_url,
            file_size,
            page_count
          )
        )
      `)
      .eq('id', readingToken.item_id)
      .single()
    
    content = bundle
  }

  if (!content) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <a href="/library" className="text-blue-600 hover:text-blue-700">
                ← Back to Library
              </a>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">
                {readingToken.purchases.item_title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Secure Reading Mode
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <BookReader 
        content={content}
        itemType={readingToken.item_type as 'book' | 'bundle'}
        isSecureMode={true}
      />
    </div>
  )
}