-- Create admin_contact_info table for storing admin contact preferences
CREATE TABLE admin_contact_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram', 'whatsapp', 'email')),
  contact_value TEXT NOT NULL,
  display_name TEXT, -- Optional display name for the contact method
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- One primary contact method per type per admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, contact_type, contact_value)
);

-- Create purchase_requests table for tracking purchase requests with contact info
CREATE TABLE purchase_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'bundle')),
  item_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected', 'completed')),
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('telegram', 'whatsapp', 'email')),
  user_message TEXT, -- Optional message from user
  admin_notes TEXT, -- Admin notes about the request
  contacted_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_admin_contact_info_admin_id ON admin_contact_info(admin_id);
CREATE INDEX idx_admin_contact_info_contact_type ON admin_contact_info(contact_type);
CREATE INDEX idx_admin_contact_info_is_active ON admin_contact_info(is_active);
CREATE INDEX idx_admin_contact_info_is_primary ON admin_contact_info(is_primary);
CREATE INDEX idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_item_type ON purchase_requests(item_type);

-- Add updated_at triggers
CREATE TRIGGER admin_contact_info_updated_at
  BEFORE UPDATE ON admin_contact_info
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on new tables
ALTER TABLE admin_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_contact_info
CREATE POLICY "Admins can manage their own contact info" ON admin_contact_info
  FOR ALL USING (auth.uid() = admin_id AND is_admin(auth.uid()));

CREATE POLICY "Users can view active admin contact info" ON admin_contact_info
  FOR SELECT USING (is_active = true);

-- RLS policies for purchase_requests
CREATE POLICY "Users can view their own purchase requests" ON purchase_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase requests" ON purchase_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase requests" ON purchase_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchase requests" ON purchase_requests
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all purchase requests" ON purchase_requests
  FOR ALL USING (is_admin(auth.uid()));

-- Function to ensure only one primary contact per type per admin
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $
BEGIN
  -- If setting this contact as primary, unset other primary contacts of the same type for this admin
  IF NEW.is_primary = true THEN
    UPDATE admin_contact_info 
    SET is_primary = false 
    WHERE admin_id = NEW.admin_id 
      AND contact_type = NEW.contact_type 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to ensure single primary contact
CREATE TRIGGER ensure_single_primary_contact_trigger
  BEFORE INSERT OR UPDATE ON admin_contact_info
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_contact();