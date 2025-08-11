-- Add cover_image_url field to bundles table
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add constraint to ensure valid URL format (optional but recommended)
ALTER TABLE bundles ADD CONSTRAINT IF NOT EXISTS chk_bundles_cover_image_url_format 
  CHECK (cover_image_url IS NULL OR cover_image_url ~ '^https?://.*\.(jpg|jpeg|png|webp|gif)(\?.*)?$');$');$');

-- Add index for better query performance when filtering by cover images
CREATE INDEX IF NOT EXISTS idx_bundles_cover_image_url ON bundles(cover_image_url) WHERE cover_image_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bundles.cover_image_url IS 'URL to the bundle cover image stored in Supabase Storage';