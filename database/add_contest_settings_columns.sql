-- Add new columns for enhanced contest constraints
ALTER TABLE contests 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS required_photos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS required_videos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_videos_allowed INTEGER DEFAULT 1;

-- Update existing rows to have default values if needed
UPDATE contests 
SET settings = '{}'::jsonb 
WHERE settings IS NULL;
