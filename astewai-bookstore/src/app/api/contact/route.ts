import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';

const contactService = new ContactService();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const primary = url.searchParams.get('primary') === 'true';

    const contacts = primary 
      ? await contactService.getPrimaryAdminContacts()
      : await contactService.getActiveAdminContacts();

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error('Error fetching admin contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact information' },
      { status: 500 }
    );
  }
}