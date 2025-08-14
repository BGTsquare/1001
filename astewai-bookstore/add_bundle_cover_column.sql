-- Add cover_image_url column to bundles table
-- Run this in your Supabase SQL Editor or database console

ALTER TABLE bundles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bundles' 
AND column_name = 'cover_image_url';