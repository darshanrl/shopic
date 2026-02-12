-- Create a test mixed media contest
-- Run this in Supabase SQL Editor

INSERT INTO public.contests (
  title,
  description,
  category,
  media_type,
  entry_fee,
  start_date,
  end_date,
  max_participants,
  max_photos_per_entry,
  prize_pool,
  rules,
  created_by
) VALUES (
  'Mixed Media Test Contest',
  'Test contest for mixed media functionality',
  'mixed',
  'both',
  0,
  NOW(),
  NOW() + INTERVAL '30 days',
  100,
  1,
  1000,
  'Test rules for mixed media contest',
  (SELECT id FROM public.users WHERE email = 'darshanrl016@gmail.com' LIMIT 1)
);

-- Verify the contest was created
SELECT id, title, media_type FROM public.contests WHERE title = 'Mixed Media Test Contest';
