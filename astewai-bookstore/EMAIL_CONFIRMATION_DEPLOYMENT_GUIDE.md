# Email Confirmation System - Deployment Guide

## 🎯 Overview

This guide covers the complete setup and deployment of the email confirmation system for the Astewai Bookstore, ensuring all authentication flows work correctly in production.

## ✅ What's Been Fixed

### 1. **Email Confirmation Redirects**
- ✅ Updated all redirect URLs to use production domain
- ✅ Created auth callback page (`/auth/callback`)
- ✅ Created email confirmation page (`/auth/confirm`)
- ✅ Created password reset page (`/auth/reset-password`)

### 2. **Supabase Auth Configuration**
- ✅ Enabled email confirmations in `supabase/config.toml`
- ✅ Set correct production URLs for confirmations and resets
- ✅ Updated signup flow to include proper redirects

### 3. **Environment Variables**
- ✅ All environment variables configured for production
- ✅ Created `.env.production` template

## 🚀 Deployment Steps

### Step 1: Update Supabase Dashboard Settings

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication → Settings

2. **Update Site URL**
   ```
   Site URL: https://astewai-bookstore.vercel.app
   ```

3. **Update Redirect URLs**
   Add these URLs to the "Redirect URLs" section:
   ```
   https://astewai-bookstore.vercel.app/auth/callback
   https://astewai-bookstore.vercel.app/auth/confirm
   https://astewai-bookstore.vercel.app/auth/reset-password
   https://astewai-bookstore.vercel.app/**
   ```

4. **Enable Email Confirmations**
   - Go to Authentication → Settings → Email Auth
   - Enable "Confirm email"
   - Set confirmation URL: `https://astewai-bookstore.vercel.app/auth/confirm`
   - Set password reset URL: `https://astewai-bookstore.vercel.app/auth/reset-password`

### Step 2: Configure Email Templates (Optional)

1. **Go to Authentication → Email Templates**
2. **Customize the templates** with your branding:
   - Confirm signup
   - Reset password
   - Magic link

### Step 3: Deploy to Vercel

1. **Update Environment Variables in Vercel**
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_SITE_URL=https://astewai-bookstore.vercel.app
   SUPABASE_AUTH_SITE_URL=https://astewai-bookstore.vercel.app
   ```

2. **Deploy the Application**
   ```bash
   git add .
   git commit -m "feat: implement email confirmation system with production redirects"
   git push origin main
   ```

### Step 4: Test Email Flows

After deployment, test these flows:

1. **User Registration**
   - Register a new account
   - Check email for confirmation link
   - Click link → should redirect to `/auth/confirm`
   - Should show success message and redirect to home

2. **Password Reset**
   - Go to forgot password page
   - Enter email and submit
   - Check email for reset link
   - Click link → should redirect to `/auth/reset-password`
   - Enter new password and submit

3. **Email Confirmation**
   - If user tries to login before confirming email
   - Should show appropriate error message
   - Resend confirmation should work

## 📧 Email Flow Diagram

```
Registration Flow:
User registers → Email sent → User clicks link → /auth/callback → Profile created → Redirect to home

Password Reset Flow:
User requests reset → Email sent → User clicks link → /auth/reset-password → Password updated → Redirect to login

Email Confirmation Flow:
User registers → Email sent → User clicks link → /auth/confirm → Email confirmed → Redirect to home
```

## 🔧 Configuration Files Updated

### 1. `supabase/config.toml`
```toml
[auth]
site_url = "https://astewai-bookstore.vercel.app"
additional_redirect_urls = ["https://astewai-bookstore.vercel.app", "http://localhost:3000"]

[auth.email]
enable_confirmations = true
confirm_url = "https://astewai-bookstore.vercel.app/auth/confirm"
reset_url = "https://astewai-bookstore.vercel.app/auth/reset-password"
```

### 2. Environment Variables
```env
NEXT_PUBLIC_SITE_URL=https://astewai-bookstore.vercel.app
SUPABASE_AUTH_SITE_URL=https://astewai-bookstore.vercel.app
```

## 🛠️ New Pages Created

1. **`/auth/callback`** - Handles OAuth and email confirmation callbacks
2. **`/auth/confirm`** - Email confirmation success/error page
3. **`/auth/reset-password`** - Password reset form

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid redirect URL" error**
   - Check Supabase dashboard redirect URLs
   - Ensure exact match with deployed domain

2. **Email confirmation not working**
   - Verify email confirmations are enabled in Supabase
   - Check email template URLs

3. **Password reset not working**
   - Verify reset URL in Supabase settings
   - Check `/auth/reset-password` page is accessible

### Debug Steps:

1. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

2. **Check browser console**
   - Look for JavaScript errors
   - Check network requests

3. **Verify environment variables**
   - Ensure all URLs use production domain
   - No localhost references in production

## ✨ Features Enabled

- ✅ Email confirmation required for new users
- ✅ Password reset via email
- ✅ Proper error handling and user feedback
- ✅ Automatic profile creation after confirmation
- ✅ Responsive design for all auth pages
- ✅ Production-ready redirect URLs

## 🎉 Success Criteria

After deployment, you should have:
- ✅ Users can register and receive confirmation emails
- ✅ Email confirmation links work and redirect properly
- ✅ Password reset emails work and redirect properly
- ✅ All auth flows use production domain
- ✅ No localhost references in production
- ✅ Proper error handling and user feedback

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify Supabase dashboard settings
3. Check Vercel environment variables
4. Review browser console for errors
