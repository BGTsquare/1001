-- MODULE 5: PAYMENTS
-- (see full script in user prompt)

-- SECTION 1: WALLET CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.wallet_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_name TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('mobile_money', 'bank_app', 'manual_bank')),
  deep_link_template TEXT,
  instructions TEXT,
  account_details JSONB,
  tx_id_pattern TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.wallet_config IS 'Configuration for available payment methods.';
COMMENT ON COLUMN public.wallet_config.deep_link_template IS 'URL template for wallet deep-linking. Can be NULL for manual methods.';
COMMENT ON COLUMN public.wallet_config.account_details IS 'JSON object for storing bank account name, number, etc.';
ALTER TABLE public.wallet_config ENABLE ROW LEVEL SECURITY;

-- SECTION 2: PAYMENT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ETB',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_initiated', 'awaiting_verification', 'completed', 'failed', 'cancelled')),
  selected_wallet_id UUID REFERENCES public.wallet_config(id) ON DELETE SET NULL,
  manual_tx_id TEXT,
  -- OCR processing fields
  ocr_processed_at TIMESTAMPTZ,
  ocr_extracted_tx_id TEXT,
  ocr_extracted_amount NUMERIC(10,2),
  ocr_confidence_score NUMERIC(3,2),
  ocr_raw_text TEXT,
  receipt_urls TEXT[],
  admin_verified_at TIMESTAMPTZ,
  admin_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  verification_method TEXT CHECK (verification_method IN ('auto', 'manual_receipt', 'manual_statement')),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.payment_requests IS 'Tracks user payment attempts from initiation to completion.';
COMMENT ON COLUMN public.payment_requests.status IS 'The current state of the payment process.';
COMMENT ON COLUMN public.payment_requests.manual_tx_id IS 'Transaction ID provided by the user for manual verification.';
COMMENT ON COLUMN public.payment_requests.receipt_urls IS 'Links to user-uploaded payment receipts in storage.';
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_requests_ocr_extracted_tx_id ON public.payment_requests(ocr_extracted_tx_id);

-- SECTION 3: RLS POLICIES
DROP POLICY IF EXISTS "Active wallet configs are publicly readable" ON public.wallet_config;
CREATE POLICY "Active wallet configs are publicly readable"
ON public.wallet_config FOR SELECT
USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins can manage wallet configs" ON public.wallet_config;
CREATE POLICY "Admins can manage wallet configs"
ON public.wallet_config FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can manage their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can manage their own payment requests"
ON public.payment_requests FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can manage all payment requests"
ON public.payment_requests FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- SECTION 4: POST-PAYMENT FULFILLMENT FUNCTION
CREATE OR REPLACE FUNCTION public.grant_purchase_to_user(p_payment_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record RECORD;
  book_record RECORD;
BEGIN
  SELECT user_id, item_type, item_id
  INTO payment_record
  FROM public.payment_requests
  WHERE id = p_payment_request_id AND status = 'completed';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completed payment request not found for ID: %', p_payment_request_id;
  END IF;
  IF payment_record.item_type = 'book' THEN
    INSERT INTO public.user_library (user_id, book_id, status)
    VALUES (payment_record.user_id, payment_record.item_id, 'owned')
    ON CONFLICT (user_id, book_id) DO UPDATE SET status = 'owned', added_at = NOW();
  ELSIF payment_record.item_type = 'bundle' THEN
    FOR book_record IN
      SELECT bb.book_id
      FROM public.bundle_books bb
      WHERE bb.bundle_id = payment_record.item_id
    LOOP
      INSERT INTO public.user_library (user_id, book_id, status)
      VALUES (payment_record.user_id, book_record.book_id, 'owned')
      ON CONFLICT (user_id, book_id) DO UPDATE SET status = 'owned', added_at = NOW();
    END LOOP;
  END IF;
END;
$$;
COMMENT ON FUNCTION public.grant_purchase_to_user(UUID) IS 'Adds a purchased book or bundle to a user''s library. To be called after successful payment verification.';

-- SECTION 5: UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_wallet_config_updated_at ON public.wallet_config;
CREATE TRIGGER update_wallet_config_updated_at
  BEFORE UPDATE ON public.wallet_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON public.payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
