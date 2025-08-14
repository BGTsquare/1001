import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/database';

export async function GET() {
  try {
    const posts = await getBlogPosts({ published: true });
    
    return NextResponse.json({
      success: true,
      count: posts?.length || 0,
      posts: posts || [],
      message: 'Blog posts fetched successfully'
    });
  } catch (error) {
    console.error('Error in blog-debug API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch blog posts',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}