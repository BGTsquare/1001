-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Profiles are created automatically" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Books policies (publicly readable, admin manageable)
CREATE POLICY "Books are publicly readable" ON books
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert books" ON books
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update books" ON books
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete books" ON books
  FOR DELETE USING (is_admin(auth.uid()));

-- Bundles policies (publicly readable, admin manageable)
CREATE POLICY "Bundles are publicly readable" ON bundles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert bundles" ON bundles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update bundles" ON bundles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete bundles" ON bundles
  FOR DELETE USING (is_admin(auth.uid()));

-- Bundle_books policies (publicly readable, admin manageable)
CREATE POLICY "Bundle books are publicly readable" ON bundle_books
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bundle books" ON bundle_books
  FOR ALL USING (is_admin(auth.uid()));

-- User_library policies (users can only access their own library)
CREATE POLICY "Users can view their own library" ON user_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own library" ON user_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library" ON user_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own library" ON user_library
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all libraries" ON user_library
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all libraries" ON user_library
  FOR ALL USING (is_admin(auth.uid()));

-- Blog_posts policies (published posts are public, admins manage all)
CREATE POLICY "Published blog posts are publicly readable" ON blog_posts
  FOR SELECT USING (published = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert blog posts" ON blog_posts
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update blog posts" ON blog_posts
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog posts" ON blog_posts
  FOR DELETE USING (is_admin(auth.uid()));

-- Purchases policies (users can only see their own purchases)
CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON purchases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all purchases" ON purchases
  FOR ALL USING (is_admin(auth.uid()));

-- Reviews policies (users can manage their own reviews, all can read)
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (is_admin(auth.uid()));