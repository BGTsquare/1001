import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if blog_posts table exists and has data
    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('Database error in test-blog:', error);
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      posts: data || [],
      message: `Found ${count || 0} blog posts in database`
    });
  } catch (error) {
    console.error('Server error in test-blog:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}