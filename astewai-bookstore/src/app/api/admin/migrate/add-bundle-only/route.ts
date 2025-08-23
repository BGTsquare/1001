import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('=== ADDING BUNDLE_ONLY FIELD TO BOOKS TABLE ===')
    
    // Add the bundle_only column if it doesn't exist
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Add bundle_only column if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'books' AND column_name = 'bundle_only'
          ) THEN
            ALTER TABLE books ADD COLUMN bundle_only BOOLEAN DEFAULT false;
            
            -- Add comment
            COMMENT ON COLUMN books.bundle_only IS 'Indicates if this book should only appear within bundles and not in the main catalog';
            
            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_books_bundle_only ON books(bundle_only);
            CREATE INDEX IF NOT EXISTS idx_books_status_bundle_only ON books(status, bundle_only);
            
            RAISE NOTICE 'Added bundle_only column to books table';
          ELSE
            RAISE NOTICE 'bundle_only column already exists';
          END IF;
        END $$;
      `
    })

    if (alterError) {
      console.error('Error adding bundle_only column:', alterError)
      
      // Try alternative approach using direct SQL
      const { error: directError } = await supabaseAdmin
        .from('books')
        .select('bundle_only')
        .limit(1)
      
      if (directError && directError.message.includes('column "bundle_only" does not exist')) {
        // Column doesn't exist, we need to add it manually
        return NextResponse.json({
          success: false,
          error: 'bundle_only column needs to be added manually to the database',
          instructions: `
            Please run this SQL in your Supabase SQL editor:
            
            ALTER TABLE books ADD COLUMN IF NOT EXISTS bundle_only BOOLEAN DEFAULT false;
            COMMENT ON COLUMN books.bundle_only IS 'Indicates if this book should only appear within bundles and not in the main catalog';
            CREATE INDEX IF NOT EXISTS idx_books_bundle_only ON books(bundle_only);
            CREATE INDEX IF NOT EXISTS idx_books_status_bundle_only ON books(status, bundle_only);
          `
        }, { status: 500 })
      }
    }

    // Test if the column exists by trying to query it
    const { data: testData, error: testError } = await supabaseAdmin
      .from('books')
      .select('id, bundle_only')
      .limit(1)

    if (testError) {
      console.error('Error testing bundle_only column:', testError)
      return NextResponse.json({
        success: false,
        error: 'Failed to verify bundle_only column',
        details: testError.message
      }, { status: 500 })
    }

    console.log('✓ bundle_only column is available')

    // Update any existing books that are part of bundles to be bundle_only
    const { data: bundleBooks, error: bundleBooksError } = await supabaseAdmin
      .from('bundle_books')
      .select('book_id')

    if (bundleBooksError) {
      console.error('Error fetching bundle books:', bundleBooksError)
    } else if (bundleBooks && bundleBooks.length > 0) {
      const bookIds = bundleBooks.map(bb => bb.book_id)
      
      const { error: updateError } = await supabaseAdmin
        .from('books')
        .update({ bundle_only: true })
        .in('id', bookIds)

      if (updateError) {
        console.error('Error updating existing bundle books:', updateError)
      } else {
        console.log(`✓ Updated ${bookIds.length} existing books to bundle_only = true`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'bundle_only field added successfully',
      columnExists: true,
      updatedExistingBooks: bundleBooks?.length || 0
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
