-- Setup Supabase Storage for SnapVerse
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'snapverse-files',
  'snapverse-files',
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/*', 'video/*', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create storage policies
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'snapverse-files');

-- Policy 2: Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'snapverse-files');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'snapverse-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'snapverse-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 5: Allow public access to view files (for public URLs)
CREATE POLICY "Allow public access to view files" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'snapverse-files');

-- 4. Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'snapverse-files';

-- 5. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
