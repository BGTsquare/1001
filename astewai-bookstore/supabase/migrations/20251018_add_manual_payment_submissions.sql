-- Migration: Add manual_payment_submissions table and related policies

BEGIN;

-- Table for manual payment submissions (one per user submission)
CREATE TABLE IF NOT EXISTS public.manual_payment_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_request_id UUID REFERENCES public.payment_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'ETB',
  tx_id TEXT,
  receipt_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  storage_paths TEXT[] DEFAULT ARRAY[]::TEXT[], -- internal storage keys
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','verified','rejected')),
  admin_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.manual_payment_submissions ENABLE ROW LEVEL SECURITY;

-- User can insert/select their own submissions; admin can manage all
DROP POLICY IF EXISTS manual_payments_user ON public.manual_payment_submissions;
CREATE POLICY manual_payments_user ON public.manual_payment_submissions FOR ALL
USING (auth.uid() = user_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON public.manual_payment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_payment_request_id ON public.manual_payment_submissions(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payment_submissions(status);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-confirmations', 'payment-confirmations', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_manual_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_manual_payments_updated_at ON public.manual_payment_submissions;
CREATE TRIGGER update_manual_payments_updated_at
  BEFORE UPDATE ON public.manual_payment_submissions FOR EACH ROW
  EXECUTE FUNCTION public.update_manual_payments_updated_at();

COMMIT;
