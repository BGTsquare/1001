-- Add status tracking fields to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_submitted_at ON books(submitted_at);

-- Update existing books to have approved status
UPDATE books SET status = 'approved', submitted_at = created_at WHERE status IS NULL;

-- Add RLS policy for book status management
CREATE POLICY "Admins can manage book status" ON books
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );