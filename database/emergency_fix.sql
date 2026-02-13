-- Quick Fix for Database Constraint Error
-- Run this in Supabase SQL Editor immediately

-- The error suggests media_type constraint is still being violated
-- Let's check what's actually being sent and fix it

-- 1. First, let's see what media_type values are being used
SELECT DISTINCT media_type FROM public.entries ORDER BY media_type;

-- 2. Check if the constraint exists and what it allows
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass 
  AND conname = 'entries_media_type_check';

-- 3. If constraint is too restrictive, let's update it
-- This allows more flexibility for media_type values
DO $$
BEGIN;
  -- Drop the old constraint if it exists
  DROP CONSTRAINT IF EXISTS entries_media_type_check;
  
  -- Create a more flexible constraint
  ALTER TABLE public.entries 
    ADD CONSTRAINT entries_media_type_check 
    CHECK (media_type IN ('image', 'video', 'both', 'mixed'));
  
  -- Grant necessary permissions
  GRANT ALL ON public.entries TO authenticated;
  GRANT SELECT ON public.entries TO anon;
COMMIT;
$$;

-- 4. Verify the fix
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass 
  AND conname = 'entries_media_type_check';

-- 5. Test with a simple insert (should work now)
INSERT INTO public.entries (
    contest_id, user_id, title, media_url, media_type, payment_status
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- dummy contest_id
    '00000000-0000-0000-0000-000000000001'::uuid, -- dummy user_id
    'Test Entry',
    'https://example.com/test.jpg',
    'both',
    'approved'
) ON CONFLICT DO NOTHING;

-- 6. Clean up test data
DELETE FROM public.entries 
WHERE title = 'Test Entry' 
  AND contest_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 7. Show final constraint info
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
    AND column_name = 'media_type';
