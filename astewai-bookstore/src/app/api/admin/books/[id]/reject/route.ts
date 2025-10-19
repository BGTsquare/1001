import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // Step 1: Get User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Step 1 Failed: Unauthorized' }, { status: 401 });
    }

    // Step 2: Check Admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
    if (adminError) {
        return NextResponse.json({ error: 'Step 2 Failed: RPC Error', details: adminError.message }, { status: 500 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Step 2 Failed: Forbidden' }, { status: 403 });
    }

    // Step 3: Parse JSON
    const { notes } = await request.json();
    if (!notes) {
        return NextResponse.json({ error: 'Step 3 Failed: Rejection notes are required' }, { status: 400 });
    }
    const bookId = params.id;

    // Step 4: Update Database
    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        status: 'rejected',
        reviewer_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Step 4 Failed: DB Update Error', details: updateError.message }, { status: 500 });
    }

    // Success
    return NextResponse.json(updatedBook);

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Overall Catch Block', details: error.message },
      { status: 500 }
    );
  }
}
