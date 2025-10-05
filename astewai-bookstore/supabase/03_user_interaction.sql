-- MODULE 3: USER INTERACTION
-- (see full script in user prompt)

-- SECTION 1: USER LIBRARY TABLE
CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned', 'pending', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_read_position TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);
COMMENT ON TABLE public.user_library IS 'Links users to the books they own, tracking reading progress.';
COMMENT ON COLUMN public.user_library.status IS 'The user''s status with the book (e.g., owned, completed).';
COMMENT ON COLUMN public.user_library.progress IS 'Reading progress as a percentage (0-100).';
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_book_id ON public.user_library(book_id);

-- SECTION 2: REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);
COMMENT ON TABLE public.reviews IS 'Stores user-submitted ratings and comments for books.';
COMMENT ON COLUMN public.reviews.rating IS 'Star rating from 1 to 5.';
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- SECTION 3: RLS POLICIES
DROP POLICY IF EXISTS "Users can manage their own library" ON public.user_library;
CREATE POLICY "Users can manage their own library"
ON public.user_library FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all user libraries" ON public.user_library;
CREATE POLICY "Admins can view all user libraries"
ON public.user_library FOR SELECT
USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
ON public.reviews FOR SELECT
USING (true);
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
CREATE POLICY "Users can manage their own reviews"
ON public.reviews FOR ALL
USING (auth.uid() = user_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));
