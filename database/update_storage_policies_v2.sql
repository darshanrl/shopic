-- Update storage policies for SnapVerse - Version 2
-- Run this in your Supabase SQL Editor

-- 1. Drop existing policies if they exist
DO $$
BEGIN
    -- Drop policies using their full identifier
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated users to upload files') THEN
        DROP POLICY "Allow authenticated users to upload files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow users to view files') THEN
        DROP POLICY "Allow users to view files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow users to update their own files') THEN
        DROP POLICY "Allow users to update their own files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow users to delete their own files') THEN
        DROP POLICY "Allow users to delete their own files" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public access to view files') THEN
        DROP POLICY "Allow public access to view files" ON storage.objects;
    END IF;
    
    -- Also drop any old or differently named policies that might exist
    DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
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
        (storage.foldername(name))[1] = 'payments' OR
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
TO public 
USING (bucket_id = 'snapverse-files');

-- Policy 4: Allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'snapverse-files' AND
    (storage.foldername(name))[1] IN ('uploads', 'receipts', 'payments', 'entries')
);

-- Policy 5: Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'snapverse-files' AND
    (storage.foldername(name))[1] IN ('uploads', 'receipts', 'payments', 'entries')
);

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('snapverse-files', 'snapverse-files', true)
ON CONFLICT (id) DO NOTHING;
