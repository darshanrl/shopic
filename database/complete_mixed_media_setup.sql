-- Complete Mixed Media Contest Database Setup
-- Run this in Supabase SQL Editor

-- 1. Add mixed media requirements fields to contests table
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS required_photos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS required_videos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_photos_allowed INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS max_videos_allowed INTEGER DEFAULT 1;

-- 2. Add video tracking fields to entries table
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_size_mb DECIMAL(8,2);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_payment_status ON public.entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_entries_contest_user ON public.entries(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_contests_media_type ON public.contests(media_type);

-- 4. Add comments for documentation
COMMENT ON COLUMN public.contests.required_photos IS 'Minimum number of photos users must upload for mixed media contests';
COMMENT ON COLUMN public.contests.required_videos IS 'Minimum number of videos users must upload for mixed media contests';
COMMENT ON COLUMN public.contests.max_photos_allowed IS 'Maximum number of photos allowed per entry';
COMMENT ON COLUMN public.contests.max_videos_allowed IS 'Maximum number of videos allowed per entry';
COMMENT ON COLUMN public.entries.video_duration_seconds IS 'Duration of uploaded video in seconds';
COMMENT ON COLUMN public.entries.video_size_mb IS 'Size of uploaded video in MB';

-- 5. Update existing contests to have default mixed media requirements
UPDATE public.contests 
SET 
    required_photos = 1,
    required_videos = 1,
    max_photos_allowed = 3,
    max_videos_allowed = 1
WHERE media_type = 'both' AND (
    required_photos IS NULL OR 
    required_videos IS NULL OR 
    max_photos_allowed IS NULL OR 
    max_videos_allowed IS NULL
);

-- 6. Verify the setup
SELECT 
    'contests' as table_name,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'contests' 
    AND column_name IN ('required_photos', 'required_videos', 'max_photos_allowed', 'max_videos_allowed', 'media_type')

UNION ALL

SELECT 
    'entries' as table_name,
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
    AND column_name IN ('payment_screenshot', 'media_url', 'media_urls', 'media_type', 'payment_status', 'video_duration_seconds', 'video_size_mb')

ORDER BY table_name, column_name;

-- 7. Test data - Create a sample mixed media contest if none exists
INSERT INTO public.contests (
    title, 
    description, 
    category, 
    media_type, 
    entry_fee, 
    prize_pool, 
    start_date, 
    end_date, 
    required_photos, 
    required_videos, 
    max_photos_allowed, 
    max_videos_allowed,
    created_by
) 
SELECT 
    'Mixed Media Photography Contest',
    'Upload your best photos and videos together!',
    'photography',
    'both',
    10.00,
    100.00,
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    2,  -- required_photos
    1,  -- required_videos  
    3,  -- max_photos_allowed
    1,  -- max_videos_allowed
    id
FROM public.users 
WHERE is_admin = true 
LIMIT 1;

-- 8. Show current contests with mixed media requirements
SELECT 
    title,
    media_type,
    required_photos,
    required_videos,
    max_photos_allowed,
    max_videos_allowed,
    entry_fee
FROM public.contests 
WHERE media_type = 'both'
ORDER BY created_at DESC;
