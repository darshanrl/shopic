-- Add max_photos_per_entry to contests table
ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_photos_per_entry INTEGER DEFAULT 1;

-- Add photo_source to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS photo_source TEXT;

-- Update existing entries to have a default photo_source
UPDATE entries SET photo_source = 'gallery' WHERE photo_source IS NULL;
