const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProfiles() {
  try {
    console.log('Checking profiles table...');

    // Check profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, role, created_at')
      .limit(10);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(profile => {
      console.log(`- ${profile.display_name} (${profile.id}) - ${profile.role}`);
    });

    // Try to get current user (this will fail if not authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('No current user (expected for service role)');
    } else {
      console.log('Current user:', user?.email);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugProfiles();