-- Update database schema for receipts

-- 1. Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL,
  receipt_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add receipt_id column to entries table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'entries' 
                 AND column_name = 'receipt_id') THEN
    ALTER TABLE public.entries 
    ADD COLUMN receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_contest_id ON public.receipts(contest_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);

-- 4. Enable Row Level Security on receipts table
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies for receipts
-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Users can view own receipts') THEN
        DROP POLICY "Users can view own receipts" ON public.receipts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Users can create receipts') THEN
        DROP POLICY "Users can create receipts" ON public.receipts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Admins can manage all receipts') THEN
        DROP POLICY "Admins can manage all receipts" ON public.receipts;
    END IF;
END $$;

-- Create new policies
CREATE POLICY "Users can view own receipts" 
ON public.receipts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all receipts" 
ON public.receipts 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- 6. Create a function to update entry's receipt_id when a receipt is created
CREATE OR REPLACE FUNCTION public.update_entry_receipt()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If this receipt is linked to an entry, update the entry's receipt_id
  IF NEW.entry_id IS NOT NULL THEN
    UPDATE public.entries 
    SET receipt_id = NEW.id, 
        payment_status = CASE 
          WHEN NEW.status = 'approved' THEN 'paid_waiting_approval' 
          WHEN NEW.status = 'rejected' THEN 'pending' 
          ELSE payment_status 
        END,
        updated_at = NOW()
    WHERE id = NEW.entry_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Create a trigger to update entry when receipt status changes
CREATE OR REPLACE FUNCTION public.update_entry_on_receipt_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if status changed
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.entry_id IS NOT NULL THEN
    UPDATE public.entries 
    SET payment_status = CASE 
          WHEN NEW.status = 'approved' THEN 'paid_waiting_approval' 
          WHEN NEW.status = 'rejected' THEN 'pending' 
          ELSE payment_status 
        END,
        updated_at = NOW()
    WHERE id = NEW.entry_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 8. Create triggers
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS after_receipt_insert ON public.receipts;
  DROP TRIGGER IF EXISTS after_receipt_update ON public.receipts;
  
  -- Create trigger for new receipts
  CREATE TRIGGER after_receipt_insert
  AFTER INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_receipt();
  
  -- Create trigger for receipt updates
  CREATE TRIGGER after_receipt_update
  AFTER UPDATE ON public.receipts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_entry_on_receipt_update();
END $$;
