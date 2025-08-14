import { NextRequest, NextResponse } from 'next/server';
import { bookContentService } from '@/lib/services/book-content-service';
import type { BookContentResponse } from '@/lib/services/book-content-service';

interface ApiError {
  error: string;
  code?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<BookContentResponse | ApiError>> {
  try {
    const { id } = await params;
    
    const result = await bookContentService.getBookContent(id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get book content' },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data!);
  } catch (error) {
    console.error('Error in book content route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}