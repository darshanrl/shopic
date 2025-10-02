-- Fix Contests Table for SnapVerse
-- Run this in your Supabase SQL Editor

-- First, check if the contests table exists and has the right structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'both';

-- Add constraint for media_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'contests_media_type_check'
    ) THEN
        ALTER TABLE public.contests 
        ADD CONSTRAINT contests_media_type_check 
        CHECK (media_type IN ('image', 'video', 'both'));
    END IF;
END $$;

-- Update existing contests to have proper media_type
UPDATE public.contests 
SET media_type = 'both' 
WHERE media_type IS NULL;

-- Ensure the table has all required columns
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';

-- Add status constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'contests_status_check'
    ) THEN
        ALTER TABLE public.contests 
        ADD CONSTRAINT contests_status_check 
        CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert a sample contest
INSERT INTO public.contests (
    title, 
    description, 
    category, 
    media_type,
    entry_fee, 
    prize_pool, 
    start_date, 
    end_date, 
    max_participants,
    status
) VALUES (
    'Test Contest',
    'This is a test contest to verify the table structure',
    'photography',
    'both',
    50.00,
    1000.00,
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    100,
    'upcoming'
) ON CONFLICT DO NOTHING;

-- Check if the test contest was created
SELECT id, title, media_type, status, created_at 
FROM public.contests 
ORDER BY created_at DESC 
LIMIT 3;
