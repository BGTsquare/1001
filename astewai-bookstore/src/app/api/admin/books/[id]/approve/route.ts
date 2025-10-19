import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { notes } = await request.json();
    const bookId = params.id;

    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        status: 'approved',
        reviewer_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Database error: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedBook);

  } catch (error: any) {
    console.error('Error in POST /api/admin/books/[id]/approve:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
