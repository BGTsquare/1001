# 🚀 Fresh Supabase Project Setup Guide

## 🎯 **Complete Solution for Production Issues**

This guide will help you set up a completely fresh Supabase project that resolves all the issues you've been experiencing:
- ✅ Email confirmation errors
- ✅ Book cover image rendering problems  
- ✅ Search functionality failures
- ✅ All console errors

## 📋 **Step-by-Step Setup Process**

### **Step 1: Create New Supabase Project (5 minutes)**

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Click **"New Project"**

2. **Project Configuration**
   - **Organization**: Select your organization
   - **Name**: `astewai-bookstore-v2` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate plan

3. **Wait for Project Creation**
   - This takes 2-3 minutes
   - Note down your new project URL and keys

### **Step 2: Apply Complete Database Migration (2 minutes)**

1. **Open SQL Editor**
   - In your new Supabase project
   - Go to **SQL Editor** → **New Query**

2. **Execute Migration Script**
   - Copy the **ENTIRE** content of `FRESH_SUPABASE_MIGRATION.sql`
   - Paste into SQL Editor
   - Click **"Run"**
   - ✅ This creates all tables, storage buckets, policies, and functions

3. **Verify Success**
   - Check the output for any errors
   - Should see verification queries at the end showing:
     - 5 storage buckets created
     - 5 RPC functions created
     - 13 tables created

### **Step 3: Configure Authentication Settings (3 minutes)**

**IMPORTANT**: Replace `YOUR_PRODUCTION_URL` with your actual production URL throughout this guide.

1. **Site URL Configuration**
   - Go to **Authentication** → **Settings**
   - Set **Site URL**: `YOUR_PRODUCTION_URL` (e.g., `https://astewai-bookstore.vercel.app`)
   - Click **Save**

2. **Redirect URLs Configuration**
   - Go to **Authentication** → **URL Configuration**
   - Add these **Redirect URLs** (replace `YOUR_PRODUCTION_URL` with your actual URL):
     ```
     YOUR_PRODUCTION_URL/auth/callback
     YOUR_PRODUCTION_URL/auth/confirm
     YOUR_PRODUCTION_URL/auth/reset-password
     YOUR_PRODUCTION_URL/**
     http://localhost:3000/auth/callback
     http://localhost:3000/auth/confirm
     http://localhost:3000/auth/reset-password
     http://localhost:3000/**
     ```
   - Click **Save**

3. **Email Templates Configuration**
   - Go to **Authentication** → **Email Templates**
   - Update **Confirm signup** template:
     - Change redirect URL to: `YOUR_PRODUCTION_URL/auth/callback`
   - Update **Reset password** template:
     - Change redirect URL to: `YOUR_PRODUCTION_URL/auth/reset-password`
   - Click **Save** for each template

3. **Email Authentication Settings**
   - Go to **Authentication** → **Settings** → **Email Auth**
   - ✅ **Enable** "Confirm email"
   - Set **Confirmation URL**: `https://astewai-bookstore.vercel.app/auth/confirm`
   - Set **Password Reset URL**: `https://astewai-bookstore.vercel.app/auth/reset-password`
   - Click **Save**

### **Step 4: Update Environment Variables (5 minutes)**

1. **Get New Supabase Credentials**
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL**
     - **anon/public key**
     - **service_role key** (click "Reveal" first)

2. **Update Local Environment**
   - Edit `astewai-bookstore/.env.local`:
   ```env
   # NEW Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
   
   # Site Configuration - CRITICAL: Must match Supabase Auth settings
   NEXT_PUBLIC_SITE_URL=YOUR_PRODUCTION_URL
   SUPABASE_AUTH_SITE_URL=YOUR_PRODUCTION_URL
   
   # Payment Configuration (keep same)
   CHAPA_SECRET_KEY=CHAPUBK_TEST-QcdliLnsHljvGKPpWGgadiL7JPuiaikX
   ```

3. **Update Vercel Environment Variables**
   - Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
   - Update these variables with your new Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

4. **Update Next.js Configuration**
   - Edit `astewai-bookstore/next.config.js`
   - Update the `remotePatterns` section:
   ```javascript
   remotePatterns: [
     {
       protocol: 'https',
       hostname: 'YOUR_NEW_PROJECT_REF.supabase.co',
       port: '',
       pathname: '/storage/v1/object/public/**',
     },
     // ... keep other patterns
   ],
   ```

### **Step 5: Create Admin User (2 minutes)**

1. **Register Admin Account**
   - Go to your application: https://astewai-bookstore.vercel.app/auth/register
   - Register with your admin email
   - Check email and confirm account

2. **Set Admin Role**
   - Go to **Supabase Dashboard** → **Table Editor** → **profiles**
   - Find your user record
   - Change `role` from `user` to `admin`
   - Click **Save**

### **Step 6: Test Everything (5 minutes)**

1. **Test Storage Buckets**
   ```bash
   cd astewai-bookstore
   node scripts/diagnose-production-issues.js
   ```
   **Expected Output**:
   ```
   ✅ book-covers bucket: Found
   ✅ Storage Files Access: Working
   ✅ Profile Table Access: Working
   ```

2. **Test RPC Functions**
   ```bash
   node scripts/test-rpc-functions.js
   ```
   **Expected Output**:
   ```
   ✅ search_books working!
   ✅ get_popular_searches working!
   ✅ get_search_suggestions working!
   ```

3. **Test Email Confirmation**
   - Register a new test account
   - Check email for confirmation link
   - Click link → should redirect to `/auth/confirm` with success
   - Try signing in → should work without errors

4. **Test Book Cover Images**
   - Upload a book with cover image in admin panel
   - Check that image displays correctly on frontend
   - No broken image placeholders

### **Step 7: Deploy Updated Application (3 minutes)**

1. **Redeploy Vercel Application**
   - Push changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: migrate to fresh Supabase project"
   git push origin main
   ```
   - Or trigger manual redeploy in Vercel Dashboard

2. **Verify Production**
   - Visit https://astewai-bookstore.vercel.app
   - Test all functionality:
     - User registration and email confirmation
     - Book browsing and cover image display
     - Search functionality
     - Admin panel access

## 🎯 **Expected Results**

After completing this setup:

### ✅ **Email Confirmation Working**
- Users receive confirmation emails
- Clicking links successfully confirms accounts  
- Sign-in works without "Email not confirmed" errors
- Profile creation automatic after confirmation

### ✅ **Book Cover Images Working**
- All book covers display correctly
- No broken image placeholders
- Fast loading from Supabase CDN
- Proper fallback for missing covers

### ✅ **Search Functionality Working**
- Advanced search without fallback errors
- Popular searches and suggestions work
- No RPC function console errors

### ✅ **Overall Application Health**
- No console errors
- PWA manifest icons load correctly
- Plausible analytics works without CSP violations
- All authentication flows work smoothly

## 🔍 **Troubleshooting**

### **If Migration Fails**
- Check SQL Editor output for specific errors
- Ensure you copied the entire migration file
- Try running sections individually if needed

### **If Environment Variables Don't Work**
- Double-check all URLs and keys are correct
- Ensure no trailing slashes in URLs
- Redeploy after updating Vercel variables

### **If Images Still Don't Load**
- Verify storage buckets exist in Supabase Dashboard
- Check Next.js remotePatterns configuration
- Test image URLs directly in browser

### **If Authentication Redirects to Localhost**
This is the most common issue with fresh Supabase setups:

1. **Check Supabase Auth Settings**:
   - Go to **Authentication** → **Settings**
   - Verify **Site URL** matches your production URL exactly
   - No trailing slashes, correct protocol (https://)

2. **Check Redirect URLs**:
   - Go to **Authentication** → **URL Configuration**
   - Ensure all redirect URLs use your production domain
   - Include both production and localhost URLs for development

3. **Check Environment Variables**:
   - Verify `NEXT_PUBLIC_SITE_URL` in Vercel matches production URL
   - Verify `SUPABASE_AUTH_SITE_URL` is set correctly
   - Redeploy after any environment variable changes

4. **Check Email Templates**:
   - Go to **Authentication** → **Email Templates**
   - Update confirmation and reset password URLs to use production domain

5. **Clear Browser Cache**:
   - Clear cookies and local storage
   - Try authentication in incognito mode

## 📞 **Support**

If you encounter any issues:
1. Run the diagnostic scripts to identify problems
2. Check Supabase Dashboard logs
3. Monitor browser console for errors
4. Verify all environment variables are set correctly

This fresh setup should resolve all your production issues completely!
