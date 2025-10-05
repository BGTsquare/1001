-- MODULE 1: AUTHENTICATION & CORE
-- (see full script in user prompt)

-- SECTION 1: PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profile data extending Supabase auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users.id.';
COMMENT ON COLUMN public.profiles.role IS 'Application-specific user role (user or admin).';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SECTION 2: HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user has the admin role. SECURITY DEFINER.';
CREATE OR REPLACE FUNCTION public.is_admin(user_id_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
BEGIN
  IF user_id_text IS NULL THEN
    RETURN FALSE;
  END IF;
  BEGIN
    uid := user_id_text::UUID;
  EXCEPTION WHEN others THEN
    RETURN FALSE;
  END;
  RETURN (SELECT public.is_admin(uid));
END;
$$;
COMMENT ON FUNCTION public.is_admin(TEXT) IS 'Overloaded version of is_admin to safely handle TEXT input.';

-- SECTION 3: RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Allow all access to own profile or if admin" ON public.profiles;
CREATE POLICY "Allow all access to own profile or if admin"
ON public.profiles
FOR ALL
USING (auth.uid() = id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = id OR is_admin(auth.uid()));
COMMENT ON POLICY "Allow all access to own profile or if admin" ON public.profiles IS 'Users can manage their own profile, and admins can manage any profile.';

-- SECTION 4: NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile for a new user. Triggered by auth.users insert.';
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- SECTION 5: UPDATED_AT UTILITY
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates the updated_at timestamp on a row before any update operation.';
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
