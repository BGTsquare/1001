# Supabase Setup for Astewai Digital Bookstore

This directory contains the database schema, migrations, and configuration for the Astewai Digital Bookstore.

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Supabase (if not already done)

```bash
supabase init
```

### 3. Start Local Development

```bash
supabase start
```

This will start the local Supabase stack including:
- PostgreSQL database
- Auth server
- Realtime server
- Storage server
- Edge Functions runtime

### 4. Run Migrations

```bash
supabase db reset
```

This will apply all migrations and seed data.

### 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

For local development, use these values after running `supabase start`:
- `NEXT_PUBLIC_SUPABASE_URL`: http://localhost:54321
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (shown in terminal after `supabase start`)

## Database Schema

### Tables

1. **profiles** - User profiles extending Supabase Auth
2. **books** - Book catalog with metadata and content
3. **bundles** - Curated book collections
4. **bundle_books** - Many-to-many relationship between bundles and books
5. **user_library** - User's personal book collection with reading progress
6. **blog_posts** - Blog content management
7. **purchases** - Purchase tracking and payment reconciliation
8. **reviews** - Book reviews and ratings (future enhancement)

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Public content (books, bundles, published blog posts) is readable by all
- Admin users have full access to all data

### Functions and Triggers

- **handle_updated_at()** - Automatically updates `updated_at` timestamps
- **handle_new_user()** - Creates user profile on signup
- **is_admin()** - Helper function for admin role checking

## Deployment

### Production Setup

1. Create a new Supabase project at https://supabase.com
2. Run migrations against production:
   ```bash
   supabase db push
   ```
3. Update environment variables with production credentials
4. Configure authentication settings in Supabase dashboard

### Backup and Recovery

Regular backups are handled by Supabase for hosted projects. For additional backup strategies:

```bash
# Export schema
supabase db dump --schema-only > schema.sql

# Export data
supabase db dump --data-only > data.sql
```

## Development Workflow

1. Make schema changes in new migration files
2. Test locally with `supabase db reset`
3. Deploy to staging/production with `supabase db push`
4. Update TypeScript types if needed

## Applying the consolidated schema

We ship a single consolidated schema at `supabase/complete_schema.sql` which replaces older migrations.

1. Ensure your `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set.
2. Run the SQL in Supabase SQL editor or use the CLI:

   - Using Supabase UI: open SQL editor and paste `supabase/complete_schema.sql` then run.
   - Using CLI: `supabase db push --file supabase/complete_schema.sql` (or split into migrations as preferred).

## Creating the initial admin user

We provide a script to create/promote the default admin using the service role key:

1. Fill `.env.local` with `ADMIN_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. Run: `node scripts/create-default-admin.js`

This script is idempotent and will create the user if missing and upsert a `profiles` row with `role = 'admin'`.

## Useful Commands

```bash
# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts

# View logs
supabase logs

# Stop local services
supabase stop
```