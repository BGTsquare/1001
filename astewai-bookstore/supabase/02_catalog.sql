-- MODULE 2: CATALOG
-- (see full script in user prompt)

-- SECTION 1: BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  content_path TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  bundle_only BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.books IS 'Stores metadata for each individual digital book.';
COMMENT ON COLUMN public.books.content_path IS 'Path to the book file in Supabase Storage.';
COMMENT ON COLUMN public.books.bundle_only IS 'If true, this book can only be acquired via a bundle.';
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books(author);
CREATE INDEX IF NOT EXISTS idx_books_tags ON public.books USING GIN(tags);

-- SECTION 2: BUNDLES TABLE
CREATE TABLE IF NOT EXISTS public.bundles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.bundles IS 'Stores curated collections of books sold as a package.';
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- SECTION 3: BUNDLE_BOOKS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.bundle_books (
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, book_id)
);
COMMENT ON TABLE public.bundle_books IS 'Junction table linking books to bundles.';
ALTER TABLE public.bundle_books ENABLE ROW LEVEL SECURITY;

-- SECTION 4: RLS POLICIES
DROP POLICY IF EXISTS "Catalog books are publicly readable" ON public.books;
CREATE POLICY "Catalog books are publicly readable"
ON public.books FOR SELECT
USING (true);
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books"
ON public.books FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Catalog bundles are publicly readable" ON public.bundles;
CREATE POLICY "Catalog bundles are publicly readable"
ON public.bundles FOR SELECT
USING (true);
DROP POLICY IF EXISTS "Admins can manage bundles" ON public.bundles;
CREATE POLICY "Admins can manage bundles"
ON public.bundles FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Bundle-book relationships are publicly readable" ON public.bundle_books;
CREATE POLICY "Bundle-book relationships are publicly readable"
ON public.bundle_books FOR SELECT
USING (true);
DROP POLICY IF EXISTS "Admins can manage bundle-book relationships" ON public.bundle_books;
CREATE POLICY "Admins can manage bundle-book relationships"
ON public.bundle_books FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- SECTION 5: UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_books_updated_at ON public.books;
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_bundles_updated_at ON public.bundles;
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON public.bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
