-- IMMEDIATE FIX for entries_media_type_check constraint error
-- Fixed version for newer PostgreSQL

-- 1. Drop the problematic constraint immediately
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_media_type_check;

-- 2. Create a new constraint that allows 'both'
ALTER TABLE public.entries 
  ADD CONSTRAINT entries_media_type_check 
  CHECK (media_type IN ('image', 'video', 'both'));

-- 3. Verify the fix using correct column names
SELECT conname, condef 
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass 
  AND conname = 'entries_media_type_check';

-- 4. Alternative verification - check constraint exists
SELECT 
    tc.constraint_name, 
    tc.check_clause 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'entries' 
  AND tc.constraint_name = 'entries_media_type_check';

-- 5. Test the constraint with a safe insert
INSERT INTO public.entries (
    contest_id, 
    user_id, 
    title, 
    media_url, 
    media_type, 
    payment_status
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Test Constraint Fix',
    'https://example.com/test.jpg',
    'both',
    'approved'
) ON CONFLICT DO NOTHING;

-- 6. Clean up test data
DELETE FROM public.entries 
WHERE title = 'Test Constraint Fix' 
  AND contest_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 7. Show all constraints on entries table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'entries'
ORDER BY tc.constraint_name;

-- 8. Show success message
SELECT '✅ Database constraint fixed! Now media_type "both" is allowed.' as status;
