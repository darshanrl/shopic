-- Update storage policies for SnapVerse
-- Run this in your Supabase SQL Editor

-- 1. Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload files') THEN
        DROP POLICY "Allow authenticated users to upload files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to view files') THEN
        DROP POLICY "Allow authenticated users to view files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update their own files') THEN
        DROP POLICY "Allow users to update their own files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to delete their own files') THEN
        DROP POLICY "Allow users to delete their own files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access to view files') THEN
        DROP POLICY "Allow public access to view files" ON storage.objects;
    END IF;
END $$;

-- 2. Create new storage policies with improved security
-- Policy 1: Allow authenticated users to upload files to specific folders
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'snapverse-files' AND 
    (
        (storage.foldername(name))[1] = 'uploads' OR
        (storage.foldername(name))[1] = 'receipts' OR
        (storage.foldername(name))[1] = 'entries'
    )
);

-- Policy 2: Allow users to view files in the bucket
CREATE POLICY "Allow users to view files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'snapverse-files');

-- Policy 3: Allow public access to view files (for public URLs)
CREATE POLICY "Allow public access to view files" 
ON storage.objects 
FOR SELECT 
TO anon 
USING (bucket_id = 'snapverse-files');

-- Policy 4: Allow users to update their own files
CREATE POLICY "Allow users to update their own files" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'snapverse-files' AND 
    (
        (storage.foldername(name))[1] = 'uploads' OR
        (storage.foldername(name))[1] = 'receipts' OR
        (storage.foldername(name))[1] = 'entries'
    )
);

-- Policy 5: Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'snapverse-files' AND 
    (
        (storage.foldername(name))[1] = 'uploads' OR
        (storage.foldername(name))[1] = 'receipts' OR
        (storage.foldername(name))[1] = 'entries'
    )
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Verify bucket settings
SELECT * FROM storage.buckets WHERE id = 'snapverse-files';
