-- Update Contests Table for Media Type Support
-- Run this in your Supabase SQL Editor

-- Add media_type column to contests table if it doesn't exist
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'both' CHECK (media_type IN ('image', 'video', 'both'));

-- Update existing contests to have 'both' as default media type
UPDATE public.contests 
SET media_type = 'both' 
WHERE media_type IS NULL;

-- Verify the update
SELECT id, title, media_type, created_at 
FROM public.contests 
ORDER BY created_at DESC 
LIMIT 5;
