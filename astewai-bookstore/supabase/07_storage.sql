-- MODULE 7: STORAGE
-- (see full script in user prompt)

-- SECTION 1: BUCKET CREATION
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('bundle-covers', 'bundle-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book-content', 'book-content', false, 104857600, ARRAY['application/pdf','application/epub+zip'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('payment-receipts', 'payment-receipts', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- SECTION 2: HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.string_to_uuid(text)
RETURNS UUID AS $$
BEGIN
  RETURN $1::UUID;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
COMMENT ON FUNCTION public.string_to_uuid(text) IS 'Safely casts a text string to a UUID, returning NULL if the format is invalid.';

-- SECTION 3: STORAGE RLS POLICIES
DROP POLICY IF EXISTS "Admins have full access to all storage buckets" ON storage.objects;
CREATE POLICY "Admins have full access to all storage buckets"
ON storage.objects FOR ALL
USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can access content of books they own" ON storage.objects;
CREATE POLICY "Users can access content of books they own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'book-content' AND
  EXISTS (
    SELECT 1
    FROM public.user_library
    WHERE user_id = auth.uid() AND book_id = (public.string_to_uuid(split_part(name, '/', 1)))
  )
);
DROP POLICY IF EXISTS "Authenticated users can upload payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.payment_requests
    WHERE user_id = auth.uid() AND id = (public.string_to_uuid(split_part(name, '/', 1)))
  )
);
DROP POLICY IF EXISTS "Users can view their own payment receipts" ON storage.objects;
CREATE POLICY "Users can view their own payment receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1
    FROM public.payment_requests
    WHERE user_id = auth.uid() AND id = (public.string_to_uuid(split_part(name, '/', 1)))
  )
);
