import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { adminContactInfoSchema } from '@/lib/validation/contact-validation';
import { createClient } from '@/lib/supabase/server';

const contactService = new ContactService();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const primary = url.searchParams.get('primary') === 'true';
    const adminId = url.searchParams.get('adminId');

    let contacts;
    if (adminId) {
      contacts = await contactService.getAdminContactInfo(adminId);
    } else if (primary) {
      contacts = await contactService.getPrimaryAdminContacts();
    } else {
      contacts = await contactService.getActiveAdminContacts();
    }

    return NextResponse.json({ data: contacts });
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