const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingProfiles() {
  try {
    console.log('Checking for users without profiles...');

    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return;
    }

    console.log(`Found ${users.length} auth users`);

    // Get all existing profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    const existingProfileIds = new Set(profiles.map(p => p.id));
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));

    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    if (usersWithoutProfiles.length === 0) {
      console.log('All users have profiles!');
      return;
    }

    // Create missing profiles
    const profilesToCreate = usersWithoutProfiles.map(user => ({
      id: user.id,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      role: 'user',
      reading_preferences: {
        fontSize: 'medium',
        theme: 'light',
        fontFamily: 'sans-serif',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data: createdProfiles, error: createError } = await supabase
      .from('profiles')
      .insert(profilesToCreate)
      .select();

    if (createError) {
      console.error('Error creating profiles:', createError);
      return;
    }

    console.log(`Successfully created ${createdProfiles.length} profiles:`);
    createdProfiles.forEach(profile => {
      console.log(`- ${profile.display_name} (${profile.id})`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixMissingProfiles();