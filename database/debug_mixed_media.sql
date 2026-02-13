-- Debug Mixed Media Contest Data
-- Run this in Supabase SQL Editor to check current data

-- 1. Check if contests have mixed media requirements
SELECT 
    id,
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

-- 2. Check recent entries with mixed media
SELECT 
    e.id,
    e.title,
    e.media_type,
    e.media_url,
    e.media_urls,
    e.payment_status,
    e.payment_screenshot,
    e.created_at,
    c.title as contest_title,
    c.media_type as contest_media_type
FROM public.entries e
JOIN public.contests c ON e.contest_id = c.id
WHERE c.media_type = 'both'
ORDER BY e.created_at DESC
LIMIT 5;

-- 3. Check if mixed media fields exist in contests table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'contests' 
    AND column_name IN ('required_photos', 'required_videos', 'max_photos_allowed', 'max_videos_allowed')
ORDER BY column_name;

-- 4. Check if entries table has media_urls field
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
    AND column_name IN ('media_urls', 'payment_screenshot', 'payment_status')
ORDER BY column_name;

-- 5. Create a test mixed media contest if none exists
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
    'Test Mixed Media Contest',
    'Upload photos and videos together!',
    'photography',
    'both',
    0.00,
    100.00,
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    2,  -- required_photos
    1,  -- required_videos
    3,  -- max_photos_allowed
    1,  -- max_videos_allowed
    u.id
FROM public.users u
WHERE u.is_admin = true 
LIMIT 1
ON CONFLICT DO NOTHING;
