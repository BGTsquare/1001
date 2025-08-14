import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { adminContactInfoSchema } from '@/lib/validation/contact-validation';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const contactService = new ContactService();
    const url = new URL(request.url);
    const primary = url.searchParams.get('primary') === 'true';
    const adminId = url.searchParams.get('adminId');

    let result;
    if (primary) {
      result = await contactService.getPrimaryAdminContacts();
    } else {
      result = await contactService.getActiveAdminContacts();
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch contacts' },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching admin contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactService = new ContactService();
    const supabase = await createClient();
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
    const validationResult = adminContactInfoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const contact = await contactService.createAdminContactInfo(user.id, validationResult.data);
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contact' },
      { status: 500 }
    );
  }
}