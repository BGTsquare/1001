Manual Payments Integration - Setup & Notes

This document describes the changes added to support manual payments (bank transfers, mobile money) with receipt uploads and admin verification.

Files added/modified

- supabase/migrations/20251018_add_manual_payment_submissions.sql
  - Adds `manual_payment_submissions` table, policies, indexes, and storage bucket `payment-confirmations`.

- src/app/api/payments/submit/route.ts (modified)
  - Accepts receipt uploads and creates a `manual_payment_submissions` record when users upload a receipt.
  - Uploads to storage bucket `payment-confirmations` (private) and returns signed preview URL.

- src/app/api/payments/upload-receipt/route.ts (new)
  - Separate upload endpoint (also used by some legacy forms).

- src/app/api/payments/config/route.ts (new)
  - Returns active `payment_config` entries to display instructions on checkout.

- src/app/api/payments/admin/* (new)
  - `list-submissions` - list manual submissions (admin only)
  - `verify` - verify or reject a submission; updates `payment_requests` and grants purchase via RPC, and notifies user
  - `preview` - returns signed URL for a stored receipt (admin only)

- src/app/api/notifications/send/route.ts (new)
  - Lightweight wrapper to send emails via existing email service.

- src/app/books/[id]/payment/payment-client.tsx (modified)
  - Shows manual payment instructions, uploads receipts with `method=manual`.

- src/components/admin/payment-dashboard.tsx (existing)
  - Dashboard already supports verifying `payment_requests`. Admin endpoints added to preview and manage manual submissions.

How to run the DB migration

1. Ensure Supabase CLI is configured and connected to your project.
2. Run: supabase db push --file=./supabase/migrations/20251018_add_manual_payment_submissions.sql

Security & design notes

- Uploaded receipts are stored in a private bucket `payment-confirmations`. Admins get signed URLs to preview files.
- Files are validated (MIME types and size) on server before upload. Max size is 10MB.
- RLS policies restrict manual submission access to the submitting user and admins.
- Admin verification flow updates `payment_requests.status` and calls RPC `grant_purchase_to_user` to add items to user library.
- Email notifications use existing `sendEmail` service; ensure `RESEND_API_KEY` is set in env.

Next steps and optional improvements

- Add background job to run OCR and auto-matching asynchronously (e.g., serverless function or CRON).
- Add UI for users to view submission history and statuses on their Orders page.
- Add unit/integration tests around the new endpoints and repository methods.
- Add better UX: progress bars for uploads, thumbnails for images, pagination for admin lists.

