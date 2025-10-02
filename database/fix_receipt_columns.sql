-- First, drop the existing columns if they exist
ALTER TABLE public.entries 
  DROP COLUMN IF EXISTS receipt_url,
  DROP COLUMN IF EXISTS receipt_file_name,
  DROP COLUMN IF EXISTS receipt_status;

-- Re-add the columns with proper constraints
ALTER TABLE public.entries
  ADD COLUMN receipt_url TEXT,
  ADD COLUMN receipt_file_name TEXT,
  ADD COLUMN receipt_status TEXT NOT NULL DEFAULT 'pending_verification';

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_entries_receipt_status;

-- Drop the policies if they exist
DROP POLICY IF EXISTS "Users can view their own receipt status" ON public.entries;
DROP POLICY IF EXISTS "Admins can update receipt status" ON public.entries;

-- Recreate the index
CREATE INDEX idx_entries_receipt_status ON public.entries(receipt_status);

-- Recreate the policies
CREATE POLICY "Users can view their own receipt status"
ON public.entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update receipt status"
ON public.entries
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND is_admin = true
));
