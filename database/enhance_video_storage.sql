-- Enhanced video storage support for contests
-- Run this in Supabase SQL Editor

-- Add video-specific fields to contests table (if not already added)
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS required_photos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS required_videos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_photos_allowed INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS max_videos_allowed INTEGER DEFAULT 1;

-- Add video duration tracking to entries table
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_size_mb DECIMAL(8,2);

-- Create index for better performance on payment status queries
CREATE INDEX IF NOT EXISTS idx_entries_payment_status ON public.entries(payment_status);

-- Create index for contest entries lookup
CREATE INDEX IF NOT EXISTS idx_entries_contest_user ON public.entries(contest_id, user_id);

-- Add comments for documentation
COMMENT ON COLUMN public.entries.video_duration_seconds IS 'Duration of uploaded video in seconds';
COMMENT ON COLUMN public.entries.video_size_mb IS 'Size of uploaded video in MB';

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entries' 
    AND column_name IN ('payment_screenshot', 'media_url', 'media_urls', 'media_type', 'payment_status', 'video_duration_seconds', 'video_size_mb')
ORDER BY column_name;
