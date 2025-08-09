# Supabase Setup Guide for Astewai Digital Bookstore

This guide will help you set up a new Supabase project for the Astewai Digital Bookstore application.

## Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Supabase CLI installed (optional but recommended)

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `astewai-bookstore` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Project API Keys** → `anon` `public` key
   - **Project API Keys** → `service_role` `secret` key

## Step 3: Update Environment Variables

1. Open `astewai-bookstore/.env.local`
2. Update the Supabase configuration with your new project credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Set Up the Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy the contents of `supabase/migrations/000_complete_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. If successful, you should see "Success. No rows returned"

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to the project directory
cd astewai-bookstore

# Initialize Supabase (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push the migrations
supabase db push
```

## Step 5: Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click "Create a new bucket"
3. Enter bucket details:
   - **Name**: `books`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 50 MB
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/gif`
     - `application/pdf`
     - `application/epub+zip`
     - `text/plain`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
4. Click "Create bucket"

Alternatively, run the storage setup SQL:

1. Go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_storage_setup.sql`
3. Paste and run it

## Step 6: Seed the Database (Optional)

To populate your database with sample data:

1. Go to **SQL Editor**
2. Copy the contents of `supabase/seed_updated.sql`
3. Paste and run it
4. This will create sample books, bundles, and blog posts

## Step 7: Set Up Authentication

1. Go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000` and your production URL
   - **Email Auth**: Enable if you want email authentication
   - **Social Providers**: Configure any social login providers you want to use

## Step 8: Create Your First Admin User

After setting up authentication:

1. Sign up for an account through your application
2. Go to **Authentication** → **Users** in Supabase dashboard
3. Find your user and copy the User ID
4. Go to **SQL Editor** and run:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

Alternatively, you can use the admin script:

```bash
cd astewai-bookstore
pnpm admin:make your-email@example.com
```

## Step 9: Test Your Setup

1. Start your development server:
   ```bash
   cd astewai-bookstore
   pnpm dev
   ```

2. Open `http://localhost:3000` in your browser
3. Try the following:
   - Browse books (should show sample data if you ran the seed)
   - Sign up for an account
   - Search for books
   - Access admin features (if you set up an admin user)

## Troubleshooting

### "Failed to fetch" Error

This usually indicates a connection issue. Check:

1. **Environment Variables**: Ensure your `.env.local` has the correct Supabase URL and keys
2. **Network**: Make sure you can access your Supabase project URL in a browser
3. **CORS**: Verify your site URL is configured in Supabase Authentication settings

### RLS Policy Issues

If you get permission errors:

1. Check that RLS policies are properly set up by running the complete schema
2. Verify your user has the correct role in the `profiles` table
3. Test with the service role key temporarily (for debugging only)

### Storage Issues

If file uploads don't work:

1. Verify the `books` bucket exists and is public
2. Check that storage policies are properly configured
3. Ensure file types and sizes are within the configured limits

## Security Considerations

1. **Never commit your service role key** to version control
2. **Use environment variables** for all sensitive configuration
3. **Enable RLS** on all tables (already done in the schema)
4. **Regularly rotate your API keys** in production
5. **Monitor your usage** to detect any unusual activity

## Production Deployment

When deploying to production:

1. Create a separate Supabase project for production
2. Update your environment variables for the production environment
3. Configure your production domain in Supabase Authentication settings
4. Set up proper monitoring and backups
5. Consider enabling additional security features like email confirmation

## Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review the application's README.md for additional setup instructions