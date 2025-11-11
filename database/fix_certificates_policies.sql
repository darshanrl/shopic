-- Fix certificates table RLS policies to allow admin winner creation
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;

-- Create new policies for certificates table
-- Allow users to view their own certificates
CREATE POLICY "Users can view own certificates" ON public.certificates 
FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to create certificates (for winner selection)
CREATE POLICY "Admins can create certificates" ON public.certificates 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to view all certificates (for management)
CREATE POLICY "Admins can view all certificates" ON public.certificates 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow public read access to certificates for winners display
CREATE POLICY "Public can view certificates for winners display" ON public.certificates 
FOR SELECT USING (true);

-- Allow admins to delete certificates (for winner management)
CREATE POLICY "Admins can delete certificates" ON public.certificates 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to update certificates (for certificate upload)
CREATE POLICY "Admins can update certificates" ON public.certificates 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);
