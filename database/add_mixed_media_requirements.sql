-- Add mixed media requirements fields to contests table
-- Run this in Supabase SQL Editor

ALTER TABLE public.contests 
ADD COLUMN required_photos INTEGER DEFAULT 1,
ADD COLUMN required_videos INTEGER DEFAULT 1,
ADD COLUMN max_photos_allowed INTEGER DEFAULT 3,
ADD COLUMN max_videos_allowed INTEGER DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN public.contests.required_photos IS 'How many photos users must upload for mixed media contests';
COMMENT ON COLUMN public.contests.required_videos IS 'How many videos users must upload for mixed media contests';
COMMENT ON COLUMN public.contests.max_photos_allowed IS 'Maximum number of photos allowed per entry';
COMMENT ON COLUMN public.contests.max_videos_allowed IS 'Maximum number of videos allowed per entry';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contests' 
AND column_name IN ('required_photos', 'required_videos', 'max_photos_allowed', 'max_videos_allowed');
