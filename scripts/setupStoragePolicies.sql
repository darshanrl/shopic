-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access to all files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (true);

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow uploads for authenticated users" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'snapverse-files' AND
    (storage.foldername(name))[1] = ANY(ARRAY['receipts', 'payments', 'submissions']) AND
    (storage.foldername(name))[2] = (auth.uid()::text)
  );

-- Policy to allow users to update their own files
CREATE POLICY "Allow updates for own files" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'snapverse-files' AND
    (storage.foldername(name))[1] = ANY(ARRAY['receipts', 'payments', 'submissions']) AND
    (storage.foldername(name))[2] = (auth.uid()::text)
  );

-- Policy to allow users to delete their own files
CREATE POLICY "Allow deletes for own files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'snapverse-files' AND
    (storage.foldername(name))[1] = ANY(ARRAY['receipts', 'payments', 'submissions']) AND
    (storage.foldername(name))[2] = (auth.uid()::text)
  );

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('snapverse-files', 'snapverse-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create the necessary folders
DO $$
BEGIN
  -- Create receipts folder
  INSERT INTO storage.objects (bucket_id, name, metadata)
  VALUES ('snapverse-files', 'receipts/.keep', '{}')
  ON CONFLICT (bucket_id, name) DO NOTHING;
  
  -- Create payments folder
  INSERT INTO storage.objects (bucket_id, name, metadata)
  VALUES ('snapverse-files', 'payments/.keep', '{}')
  ON CONFLICT (bucket_id, name) DO NOTHING;
  
  -- Create submissions folder
  INSERT INTO storage.objects (bucket_id, name, metadata)
  VALUES ('snapverse-files', 'submissions/.keep', '{}')
  ON CONFLICT (bucket_id, name) DO NOTHING;
END $$;
