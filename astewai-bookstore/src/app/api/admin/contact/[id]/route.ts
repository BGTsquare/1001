import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { createClient } from '@/lib/supabase/server';

const contactService = new ContactService();

export async function PUT(
  request: NextRequest,
  context: any
) {
  const { id } = context.params;
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const contact = await contactService.updateAdminContactInfo(id, body);
    return NextResponse.json({ data: contact });
  } catch (error) {
    console.error('Error updating admin contact info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update contact information' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  const { id } = context.params;
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await contactService.deleteAdminContactInfo(id);
    return NextResponse.json({ message: 'Contact information deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin contact info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete contact information' },
      { status: 500 }
    );
  }
}