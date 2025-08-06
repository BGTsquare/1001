/**
 * Analytics Export API Route
 * Exports analytics data as CSV for admin download
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/auth/admin';

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
        .select('id, email, display_name, role, created_at')
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
          profiles:user_id(email),
          books:item_id(title),
          bundles:item_id(title)
        `)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('user_library')
        .select(`
          id,
          status,
          progress,
          added_at,
          profiles:user_id(email),
          books:book_id(title)
        `)
        .gte('added_at', startDate.toISOString())
    ]);

    // Create CSV content
    const csvSections = [];

    // Users section
    csvSections.push('USERS');
    csvSections.push('ID,Email,Display Name,Role,Created At');
    users?.forEach(user => {
      csvSections.push(`${user.id},${user.email},${user.display_name || ''},${user.role},${user.created_at}`);
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
    csvSections.push('ID,User Email,Item Name,Amount,Status,Created At');
    purchases?.forEach(purchase => {
      const itemName = purchase.item_type === 'book' 
        ? purchase.books?.title || 'Unknown Book'
        : purchase.bundles?.title || 'Unknown Bundle';
      csvSections.push(`${purchase.id},${purchase.profiles?.email || ''},"${itemName}",${purchase.amount},${purchase.status},${purchase.created_at}`);
    });
    csvSections.push('');

    // User Library section
    csvSections.push('USER LIBRARY');
    csvSections.push('ID,User Email,Book Title,Status,Progress,Added At');
    userLibrary?.forEach(entry => {
      csvSections.push(`${entry.id},${entry.profiles?.email || ''},"${entry.books?.title || ''}",${entry.status},${entry.progress},${entry.added_at}`);
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