-- MODULE 6: SITE CONFIGURATION
-- (see full script in user prompt)

-- SECTION 1: ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.admin_settings IS 'Key-value store for global site configuration.';
COMMENT ON COLUMN public.admin_settings.key IS 'The unique identifier for the setting (e.g., "site_name").';
COMMENT ON COLUMN public.admin_settings.value IS 'The value of the setting (e.g., "Astewai Books").';
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- SECTION 2: ADMIN CONTACT INFO TABLE
CREATE TABLE IF NOT EXISTS public.admin_contact_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram', 'whatsapp', 'email', 'phone')),
  contact_value TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.admin_contact_info IS 'Stores public-facing contact information for customer support.';
COMMENT ON COLUMN public.admin_contact_info.contact_type IS 'The type of contact method (e.g., telegram).';
COMMENT ON COLUMN public.admin_contact_info.contact_value IS 'The actual contact detail (e.g., "@AstewaiSupport" or "+251...").';
ALTER TABLE public.admin_contact_info ENABLE ROW LEVEL SECURITY;

-- SECTION 3: RLS POLICIES
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.admin_settings;
CREATE POLICY "Admins can manage site settings"
ON public.admin_settings FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Active contact info is publicly readable" ON public.admin_contact_info;
CREATE POLICY "Active contact info is publicly readable"
ON public.admin_contact_info FOR SELECT
USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins can manage contact info" ON public.admin_contact_info;
CREATE POLICY "Admins can manage contact info"
ON public.admin_contact_info FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- SECTION 4: UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_admin_contact_info_updated_at ON public.admin_contact_info;
CREATE TRIGGER update_admin_contact_info_updated_at
  BEFORE UPDATE ON public.admin_contact_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- SECTION 5: SEED DATA (OPTIONAL)
INSERT INTO public.admin_settings (key, value)
VALUES
  ('site_name', 'Astewai Digital Bookstore'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.admin_contact_info (contact_type, contact_value, display_name, is_active)
VALUES
  ('telegram', '@AstewaiSupport', 'Telegram Support', TRUE),
  ('email', 'support@astewai.com', 'Email Support', TRUE)
ON CONFLICT DO NOTHING;
