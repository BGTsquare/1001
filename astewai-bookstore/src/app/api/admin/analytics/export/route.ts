/**
 * Analytics Export API Route
 * Exports analytics data as CSV for admin download
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/auth/admin';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get detailed data for export
    const [
      { data: users },
      { data: books },
      { data: purchases },
      { data: userLibrary }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, role, created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('books')
        .select('id, title, author, category, price, is_free, created_at'),
      supabase
        .from('purchases')
        .select(`
          id,
          amount,
          status,
          created_at,
          item_type,
          item_id
        `)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('user_library')
        .select(`
          id,
          status,
          progress,
          added_at,
          book_id
        `)
        .gte('added_at', startDate.toISOString())
    ]);

    // Create CSV content
    const csvSections = [];

    // Users section
    csvSections.push('USERS');
    csvSections.push('ID,Display Name,Role,Created At');
    users?.forEach(user => {
      csvSections.push(`${user.id},${user.display_name || ''},${user.role},${user.created_at}`);
    });
    csvSections.push('');

    // Books section
    csvSections.push('BOOKS');
    csvSections.push('ID,Title,Author,Category,Price,Is Free,Created At');
    books?.forEach(book => {
      csvSections.push(`${book.id},"${book.title}","${book.author}",${book.category || ''},${book.price},${book.is_free},${book.created_at}`);
    });
    csvSections.push('');

    // Purchases section
    csvSections.push('PURCHASES');
    csvSections.push('ID,Item Type,Item ID,Amount,Status,Created At');
    purchases?.forEach(purchase => {
      csvSections.push(`${purchase.id},${purchase.item_type},${purchase.item_id},${purchase.amount},${purchase.status},${purchase.created_at}`);
    });
    csvSections.push('');

    // User Library section
    csvSections.push('USER LIBRARY');
    csvSections.push('ID,Book ID,Status,Progress,Added At');
    userLibrary?.forEach(entry => {
      csvSections.push(`${entry.id},${entry.book_id},${entry.status},${entry.progress},${entry.added_at}`);
    });

    const csvContent = csvSections.join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${range}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}