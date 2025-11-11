-- Add allow_camera_uploads and allow_gallery_uploads to contests table
ALTER TABLE contests 
  ADD COLUMN IF NOT EXISTS allow_camera_uploads BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_gallery_uploads BOOLEAN DEFAULT TRUE;
