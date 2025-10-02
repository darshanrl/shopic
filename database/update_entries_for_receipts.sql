-- Add receipt-related columns to entries table
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT,
ADD COLUMN IF NOT EXISTS receipt_status TEXT DEFAULT 'pending_verification';

-- Update existing entries with receipt data if payment_screenshot exists
UPDATE public.entries
SET 
  receipt_url = payment_screenshot,
  receipt_file_name = substring(payment_screenshot from 'receipts/(.*)$'),
  receipt_status = CASE 
    WHEN payment_status = 'approved' THEN 'verified'
    WHEN payment_status = 'rejected' THEN 'rejected'
    ELSE 'pending_verification'
  END
WHERE payment_screenshot IS NOT NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_entries_receipt_status ON public.entries(receipt_status);

-- Update RLS policies if needed
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own receipt status
CREATE POLICY "Users can view their own receipt status"
ON public.entries
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to update receipt status
CREATE POLICY "Admins can update receipt status"
ON public.entries
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND is_admin = true
));
