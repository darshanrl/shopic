-- Setup Admin User for SnapVerse
-- Run this in your Supabase SQL Editor after applying the main schema

-- First, let's check if the user exists and update their admin status
-- This will work for both existing and new users

-- Update existing user to admin (if they already exist)
UPDATE public.users 
SET is_admin = true 
WHERE email = 'darshanrl016@gmail.com';

-- If the user doesn't exist yet, this will create them as admin when they first log in
-- The application code will automatically detect this email and set is_admin = true

-- Verify the admin user
SELECT id, email, full_name, is_admin, created_at 
FROM public.users 
WHERE email = 'darshanrl016@gmail.com';

-- Optional: Create a function to automatically make specific emails admin
CREATE OR REPLACE FUNCTION make_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the email should be admin
  IF NEW.email = 'darshanrl016@gmail.com' THEN
    NEW.is_admin = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set admin status
CREATE TRIGGER set_admin_on_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION make_user_admin();

-- Create trigger to automatically set admin status on update
CREATE TRIGGER set_admin_on_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION make_user_admin();
