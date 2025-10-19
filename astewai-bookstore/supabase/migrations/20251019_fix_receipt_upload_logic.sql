-- Create the storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create the manual_payment_submissions table
CREATE TABLE IF NOT EXISTS public.manual_payment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for storage.objects (receipts bucket)
-- 1. Allow authenticated users to upload receipts
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid() IS NOT NULL
);

-- 2. Allow users to view their own receipts
CREATE POLICY "Allow users to view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 3. Allow admins to view all receipts
CREATE POLICY "Allow admins to view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' AND
    public.is_admin(auth.uid())
);

-- RLS Policies for manual_payment_submissions table
-- 1. Enable RLS
ALTER TABLE public.manual_payment_submissions ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to create their own submissions
CREATE POLICY "Allow users to create their own submissions"
ON public.manual_payment_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to see their own submissions
CREATE POLICY "Allow users to see their own submissions"
ON public.manual_payment_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Allow admins to see all submissions
CREATE POLICY "Allow admins to see all submissions"
ON public.manual_payment_submissions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 5. Allow admins to update submissions (approve/reject)
CREATE POLICY "Allow admins to update submissions"
ON public.manual_payment_submissions FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));
