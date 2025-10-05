# 🔧 Network Error Fix Guide

## 🚨 **Issue Diagnosed**

The "Network error occurred" message on your production site is caused by:

1. **❌ Missing Storage Buckets** (0/5 created)
2. **❌ Incomplete RPC Functions** (`get_search_suggestions` missing)
3. **❌ Wrong Production URLs** in environment variables
4. **❌ API Endpoints Returning 401** due to incomplete setup

## 🎯 **Complete Fix Process**

### **Step 1: Apply Database Migration (CRITICAL)**

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project: `klrijufvnrfefxicyadw`

2. **Navigate to SQL Editor**:
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Apply the Migration**:
   - Open `FRESH_SUPABASE_MIGRATION.sql` in your project
   - Copy the ENTIRE content (852 lines)
   - Paste into Supabase SQL Editor
   - Click **Run**

4. **Verify Success**:
   - You should see "Success. No rows returned" message
   - Check that storage buckets are created in Storage tab

### **Step 2: Configure Authentication Settings**

1. **Go to Authentication Settings**:
   - In Supabase Dashboard → **Authentication** → **Settings**

2. **Update Site URL**:
   ```
   Site URL: https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app
   ```

3. **Add Redirect URLs**:
   ```
   https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app/auth/callback
   https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app/auth/confirm
   https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app/auth/reset-password
   ```

4. **Enable Email Confirmation** (Optional):
   - Toggle "Enable email confirmations" if you want email verification

### **Step 3: Update Vercel Environment Variables**

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/dashboard
   - Select your `astewai-bookstore` project

2. **Update Environment Variables**:
   - Go to **Settings** → **Environment Variables**
   - Update these variables:

   ```env
   NEXT_PUBLIC_SITE_URL=https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app
   SUPABASE_AUTH_SITE_URL=https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app
   ```

3. **Redeploy**:
   - After updating environment variables, trigger a new deployment

### **Step 4: Test the Fix**

Run the diagnostic script to verify everything is working:

```bash
node scripts/test-production-connectivity.js
```

**Expected Results After Fix**:
```
✅ Storage accessible (5 buckets)
   ✅ book-covers: Found (Public: true)
   ✅ book-content: Found (Public: false)
   ✅ blog-images: Found (Public: true)
   ✅ avatars: Found (Public: true)
   ✅ payment-confirmations: Found (Public: false)

✅ search_books: Working
✅ get_popular_searches: Working
✅ get_search_suggestions: Working

✅ /api/test/supabase: 200 OK
✅ /api/books: 200 OK
✅ /api/bundles: 200 OK
✅ /api/blog: 200 OK
```

## 🔍 **What Each Fix Addresses**

### **Database Migration Fixes**:
- ✅ Creates all 5 storage buckets with proper policies
- ✅ Adds missing RPC functions (`get_search_suggestions`)
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates proper indexes for performance
- ✅ Establishes all table relationships

### **Authentication Configuration Fixes**:
- ✅ Enables proper redirect flows for login/signup
- ✅ Fixes email confirmation URLs
- ✅ Resolves CORS issues with authentication

### **Environment Variable Fixes**:
- ✅ Corrects production URL references
- ✅ Ensures API calls go to the right endpoints
- ✅ Fixes authentication callback URLs

## ⚡ **Quick Verification**

After applying all fixes, test these on your production site:

1. **User Registration**: Should work without network errors
2. **User Login**: Should authenticate successfully
3. **Book Browsing**: Should load (even if no books yet)
4. **Search**: Should work without errors
5. **Admin Panel**: Should be accessible

## 🚨 **If Issues Persist**

If you still see network errors after applying all fixes:

1. **Check Browser Console**:
   - Open Developer Tools → Console
   - Look for specific error messages
   - Share the exact error details

2. **Verify Migration Applied**:
   ```bash
   node scripts/test-rpc-functions.js
   ```

3. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Look for authentication or API errors

4. **Clear Browser Cache**:
   - Hard refresh the production site
   - Try in incognito/private mode

## 📞 **Support**

If you need help with any step:
1. Share the exact error message from browser console
2. Confirm which steps you've completed
3. Run the diagnostic script and share results

The migration file contains everything needed to resolve the network connectivity issues. Once applied, your production site should work perfectly! 🚀
