import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users with their profiles
    const { data: profiles, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        avatar_url,
        role,
        reading_preferences,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get auth users to get email addresses
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch user authentication data' },
        { status: 500 }
      );
    }

    // Combine profile data with auth data
    const usersWithEmail = profiles?.map(profile => {
      const authUser = authUsers.users.find(au => au.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || 'Unknown',
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed_at: authUser?.email_confirmed_at
      };
    }) || [];

    return NextResponse.json({
      data: usersWithEmail,
      message: 'Users fetched successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}