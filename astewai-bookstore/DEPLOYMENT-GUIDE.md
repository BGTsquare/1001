# Astewai Digital Bookstore - Deployment Guide

This guide will help you deploy your Astewai Digital Bookstore to Vercel with Supabase.

## Prerequisites

- Node.js 18+ installed
- Git repository
- Supabase account
- Vercel account

## Step 1: Set Up Supabase Database

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: `astewai-bookstore`
   - Generate a strong password
   - Select a region (preferably close to your users)

2. **Run the database schema:**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the sidebar
   - Copy the entire content of `complete-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema
   - Verify success by checking the "Tables" section

3. **Configure authentication:**
   - Go to "Authentication" > "Settings"
   - Enable Email authentication
   - Set Site URL to your future Vercel domain (update later)
   - Configure redirect URLs

4. **Get your API keys:**
   - Go to "Settings" > "API"
   - Copy the Project URL and Anon Public Key
   - Copy the Service Role Key (keep this secret!)

## Step 2: Configure Environment Variables

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your values:**
   ```env
   # Supabase Configuration (Required)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME="Astewai Digital Bookstore"

   # Optional configurations (set as needed)
   NODE_ENV=development
   ```

## Step 3: Test Locally

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run the development server:**
   ```bash
   pnpm run dev
   ```

3. **Test the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Register a new account
   - Verify database connection works
   - Test browsing books and bundles

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy the project:**
   ```bash
   vercel
   ```
   
   - Follow the prompts
   - Choose your team/organization
   - Confirm project name: `astewai-bookstore`
   - Confirm build settings

4. **Configure environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

   Set each value when prompted.

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option B: Deploy via GitHub Integration

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select your repository

3. **Configure build settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

4. **Add environment variables:**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add each variable from your `.env.local`
   - Make sure to select appropriate environments (Production, Preview, Development)

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

## Step 5: Post-Deployment Configuration

1. **Update Supabase settings:**
   - Go to your Supabase project
   - Authentication > Settings
   - Update Site URL to your Vercel domain
   - Add redirect URLs for authentication

2. **Test production deployment:**
   - Visit your Vercel domain
   - Test user registration/login
   - Test book browsing and purchase flow
   - Verify all features work

3. **Set up custom domain (optional):**
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain
   - Configure DNS settings as instructed

## Step 6: Create Admin User

1. **Register as a user** on your deployed site

2. **Promote to admin** via Supabase:
   - Go to Supabase > Table Editor
   - Open `profiles` table
   - Find your user record
   - Change `role` from `user` to `admin`
   - Save changes

3. **Verify admin access:**
   - Log out and log back in
   - You should now see admin features

## Environment Variables Reference

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

### Optional Variables:
- `NEXT_PUBLIC_APP_URL` - Your app's URL
- `NEXT_PUBLIC_APP_NAME` - Display name for your app
- `RESEND_API_KEY` - For email functionality
- `TELEGRAM_BOT_TOKEN` - For Telegram integration
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - For analytics

## Troubleshooting

### Common Issues:

1. **Build errors:**
   - Check TypeScript errors: `npm run type-check`
   - Lint issues: `npm run lint:fix`
   - Missing environment variables

2. **Database connection issues:**
   - Verify Supabase URL and keys
   - Check if schema was applied correctly
   - Ensure RLS policies allow access

3. **Authentication problems:**
   - Verify Site URL in Supabase settings
   - Check redirect URLs configuration
   - Ensure email templates are configured

4. **Performance issues:**
   - Check bundle size: `npm run build`
   - Monitor Vercel function execution times
   - Optimize images and assets

### Support Resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## Maintenance

### Regular Tasks:
- Monitor error logs in Vercel dashboard
- Update dependencies regularly
- Backup database periodically
- Monitor performance metrics

### Updates:
- Test changes locally first
- Use preview deployments for testing
- Deploy to production after verification

Your Astewai Digital Bookstore should now be successfully deployed! 🎉
