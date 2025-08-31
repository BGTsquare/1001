#!/usr/bin/env node

/**
 * Script to fix book cover images by ensuring all books have valid cover_image_url values
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample cover images from Unsplash
const sampleCovers = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=600&fit=crop&crop=center'
]

async function fixBookCovers() {
  try {
    console.log('🔍 Checking books without cover images...')
    
    // Get all books without cover images
    const { data: booksWithoutCovers, error: fetchError } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url')
      .or('cover_image_url.is.null,cover_image_url.eq.')
      .limit(50)

    if (fetchError) {
      console.error('❌ Error fetching books:', fetchError)
      return
    }

    console.log(`📚 Found ${booksWithoutCovers.length} books without cover images`)

    if (booksWithoutCovers.length === 0) {
      console.log('✅ All books already have cover images!')
      
      // Let's also check what covers exist
      const { data: allBooks, error: allBooksError } = await supabase
        .from('books')
        .select('id, title, cover_image_url')
        .limit(10)

      if (!allBooksError && allBooks) {
        console.log('\n📖 Sample of existing books:')
        allBooks.forEach((book, index) => {
          console.log(`${index + 1}. ${book.title}`)
          console.log(`   Cover: ${book.cover_image_url || 'No cover'}`)
        })
      }
      
      return
    }

    // Update books with sample cover images
    const updates = booksWithoutCovers.map((book, index) => ({
      id: book.id,
      cover_image_url: sampleCovers[index % sampleCovers.length]
    }))

    console.log('🔄 Updating book covers...')
    
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('books')
        .update({ cover_image_url: update.cover_image_url })
        .eq('id', update.id)

      if (updateError) {
        console.error(`❌ Error updating book ${update.id}:`, updateError)
      } else {
        console.log(`✅ Updated cover for book: ${update.id}`)
      }
    }

    console.log('🎉 Book cover update completed!')

    // Verify the updates
    const { data: updatedBooks, error: verifyError } = await supabase
      .from('books')
      .select('id, title, cover_image_url')
      .in('id', updates.map(u => u.id))

    if (!verifyError && updatedBooks) {
      console.log('\n✅ Verification - Updated books:')
      updatedBooks.forEach((book, index) => {
        console.log(`${index + 1}. ${book.title}`)
        console.log(`   Cover: ${book.cover_image_url}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function testImageUrls() {
  console.log('\n🧪 Testing sample image URLs...')
  
  for (let i = 0; i < Math.min(3, sampleCovers.length); i++) {
    const url = sampleCovers[i]
    console.log(`Testing: ${url}`)
    
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        console.log(`✅ Image ${i + 1} is accessible`)
      } else {
        console.log(`❌ Image ${i + 1} returned status: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Image ${i + 1} failed to load:`, error.message)
    }
  }
}

async function main() {
  console.log('🚀 Starting book cover fix script...\n')
  
  await testImageUrls()
  await fixBookCovers()
  
  console.log('\n✨ Script completed!')
}

// Run the script
main().catch(console.error)
