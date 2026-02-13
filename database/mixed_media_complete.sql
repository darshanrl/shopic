-- Complete Mixed Media Database Setup
-- Run this in Supabase SQL Editor to properly store both images and videos

-- 1. First, fix the media_type constraint to allow 'both'
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_media_type_check;
ALTER TABLE public.entries 
  ADD CONSTRAINT entries_media_type_check 
  CHECK (media_type IN ('image', 'video', 'both'));

-- 2. Add indexes for better performance on mixed media queries
CREATE INDEX IF NOT EXISTS idx_entries_media_type ON public.entries(media_type);
CREATE INDEX IF NOT EXISTS idx_entries_media_urls ON public.entries USING GIN(media_urls);
CREATE INDEX IF NOT EXISTS idx_entries_contest_payment ON public.entries(contest_id, payment_status);

-- 3. Add video metadata fields for better tracking
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_media_size_mb DECIMAL(10,2) DEFAULT 0;

-- 4. Create a function to automatically update media counts
CREATE OR REPLACE FUNCTION update_media_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts based on media_urls content
  IF NEW.media_urls IS NOT NULL THEN
    NEW.image_count := (
      SELECT COUNT(*)::INTEGER 
      FROM jsonb_array_elements_text(NEW.media_urls) as url 
      WHERE url LIKE '%.jpg' OR url LIKE '%.jpeg' OR url LIKE '%.png' OR url LIKE '%.gif' OR url LIKE '%.webp'
    );
    
    NEW.video_count := (
      SELECT COUNT(*)::INTEGER 
      FROM jsonb_array_elements_text(NEW.media_urls) as url 
      WHERE url LIKE '%.mp4' OR url LIKE '%.mov' OR url LIKE '%.avi' OR url LIKE '%.webm'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically update counts
DROP TRIGGER IF EXISTS update_media_counts_trigger ON public.entries;
CREATE TRIGGER update_media_counts_trigger
  BEFORE INSERT OR UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION update_media_counts();

-- 6. Create a view for easy mixed media queries
CREATE OR REPLACE VIEW mixed_media_entries AS
SELECT 
  e.*,
  c.title as contest_title,
  c.media_type as contest_media_type,
  CASE 
    WHEN e.media_type = 'both' THEN true
    ELSE false
  END as is_mixed_media
FROM public.entries e
JOIN public.contests c ON e.contest_id = c.id
WHERE e.media_type = 'both' OR c.media_type = 'both';

-- 7. Add comments for documentation
COMMENT ON COLUMN public.entries.media_urls IS 'JSONB array containing all media URLs (images and videos) for mixed media entries';
COMMENT ON COLUMN public.entries.video_count IS 'Automatically calculated count of videos in media_urls';
COMMENT ON COLUMN public.entries.image_count IS 'Automatically calculated count of images in media_urls';
COMMENT ON COLUMN public.entries.total_media_size_mb IS 'Total size of all media files in MB';

-- 8. Create sample mixed media entry for testing
INSERT INTO public.entries (
  contest_id,
  user_id,
  title,
  caption,
  media_url,
  media_urls,
  media_type,
  payment_status,
  image_count,
  video_count
) VALUES (
  (SELECT id FROM public.contests WHERE media_type = 'both' LIMIT 1),
  (SELECT id FROM public.users WHERE is_admin = true LIMIT 1),
  'Sample Mixed Media Entry',
  'This is a test entry with both images and videos',
  'https://example.com/primary-image.jpg',
  '[
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg", 
    "https://example.com/video1.mp4"
  ]'::jsonb,
  'both',
  'approved',
  2,
  1
) ON CONFLICT DO NOTHING;

-- 9. Verify the setup
SELECT 
    'entries' as table_name,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
    AND column_name IN ('media_url', 'media_urls', 'media_type', 'image_count', 'video_count', 'total_media_size_mb')
ORDER BY column_name

UNION ALL

SELECT 
    'constraints' as table_name,
    conname as column_name, 
    consrc as data_type, 
    null as column_default,
    null as is_nullable
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass 
  AND conname = 'entries_media_type_check'

UNION ALL

SELECT 
    'indexes' as table_name,
    indexname as column_name, 
    indexdef as data_type, 
    null as column_default,
    null as is_nullable
FROM pg_indexes 
WHERE tablename = 'entries' 
  AND indexname LIKE 'idx_entries_%';

-- 10. Show sample mixed media entries
SELECT 
  title,
  media_type,
  image_count,
  video_count,
  media_urls
FROM mixed_media_entries
LIMIT 5;

SELECT '✅ Mixed media database setup complete! Both images and videos will now be properly stored in media_urls JSONB field.' as status;
