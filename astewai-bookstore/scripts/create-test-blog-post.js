const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestBlogPost() {
  try {
    console.log('Creating test blog post...');
    
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: 'Test Blog Post from Script',
        excerpt: 'This is a test blog post created from a script to verify the blog functionality is working.',
        content: `# Test Blog Post

This is a test blog post created from a script to verify that the blog functionality is working correctly.

## Features Tested

- Blog post creation
- Database insertion
- API functionality
- Admin panel integration

## Next Steps

If you can see this post in the admin panel and on the blog page, then the blog functionality is working correctly!

You can now:
1. Create new blog posts from the admin panel
2. Edit existing posts
3. Delete posts
4. View posts on the public blog page

Happy blogging!`,
        category: 'Test',
        tags: ['test', 'admin', 'functionality'],
        published: true,
        // author_id will be set by the database trigger or can be null for system posts
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return;
    }

    console.log('Test blog post created successfully:', data);
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestBlogPost();