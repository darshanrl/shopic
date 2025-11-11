-- Fix Entries Table - Add Missing Columns
-- Run this in your Supabase SQL Editor

-- Add entry_fee column to entries table
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS entry_fee DECIMAL(10,2) DEFAULT 0;

-- Update existing entries to have entry_fee from their contest
UPDATE public.entries
SET entry_fee = (
  SELECT c.entry_fee 
  FROM public.contests c 
  WHERE c.id = entries.contest_id
)
WHERE entry_fee IS NULL OR entry_fee = 0;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'entries'
AND table_schema = 'public'
ORDER BY ordinal_position;

