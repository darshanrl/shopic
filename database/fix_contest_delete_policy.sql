-- Fix contest delete policy to allow any admin to delete contests
-- Run this in Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only creator admin can delete contest" ON public.contests;

-- Create new policy allowing any admin to delete contests
CREATE POLICY "Admins can delete any contest" ON public.contests FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'contests' AND cmd = 'DELETE';
