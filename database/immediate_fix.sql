-- IMMEDIATE FIX for Database Constraint Error
-- Run this in Supabase SQL Editor RIGHT NOW to fix the issue

-- The error: "new row for relation "entries" violates check constraint "entries_media_type_check"
-- This means the constraint is too restrictive

-- 1. First, let's see what the current constraint looks like
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass 
  AND conname = 'entries_media_type_check';

-- 2. Drop the problematic constraint immediately
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_media_type_check;

-- 3. Create a more flexible constraint that allows 'both'
ALTER TABLE public.entries 
  ADD CONSTRAINT entries_media_type_check 
  CHECK (media_type IN ('image', 'video', 'both', 'mixed'));

-- 4. Verify the fix worked
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass 
  AND conname = 'entries_media_type_check';

-- 5. Test the constraint with a safe insert (should work now)
INSERT INTO public.entries (
    contest_id, 
    user_id, 
    title, 
    media_url, 
    media_type, 
    payment_status
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

-- 7. Show the final constraint
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
    AND column_name = 'media_type';

-- 8. Also check if there are any entries with invalid media_type
SELECT 
    id, 
    media_type, 
    title,
    created_at
FROM public.entries 
WHERE media_type NOT IN ('image', 'video', 'both', 'mixed')
LIMIT 5;

-- Success message
SELECT 'Database constraint fixed! Try uploading again.' as message;
