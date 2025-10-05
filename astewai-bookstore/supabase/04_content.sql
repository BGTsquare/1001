-- MODULE 4: CONTENT
-- (see full script in user prompt)

-- SECTION 1: BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.blog_posts IS 'Stores articles for the website''s blog.';
COMMENT ON COLUMN public.blog_posts.author_id IS 'The user who wrote the post. Null if the author account was deleted.';
COMMENT ON COLUMN public.blog_posts.published IS 'Controls visibility. TRUE for public, FALSE for draft.';
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING GIN(tags);

-- SECTION 2: RLS POLICIES
DROP POLICY IF EXISTS "Published blog posts are publicly viewable" ON public.blog_posts;
CREATE POLICY "Published blog posts are publicly viewable"
ON public.blog_posts FOR SELECT
USING (published = TRUE);
DROP POLICY IF EXISTS "Authors and admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Authors and admins can manage blog posts"
ON public.blog_posts FOR ALL
USING (auth.uid() = author_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = author_id OR is_admin(auth.uid()));

-- SECTION 3: UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
