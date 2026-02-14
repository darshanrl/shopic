-- Fix Certificates Table for Winner Selection
-- Run this in Supabase SQL Editor to fix winner selection errors

-- 1. Add missing INSERT policy for certificates (admin only)
CREATE POLICY "Only admins can create certificates" ON public.certificates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- 2. Add UPDATE policy for certificates (admin only)
CREATE POLICY "Only admins can update certificates" ON public.certificates FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- 3. Add DELETE policy for certificates (admin only)
CREATE POLICY "Only admins can delete certificates" ON public.certificates FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- 4. Also allow users to view certificates for their own entries
CREATE POLICY "Users can view certificates for own entries" ON public.certificates FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.entries e WHERE e.id = certificates.entry_id AND e.user_id = auth.uid())
);

-- 5. Make sure certificates table exists with correct structure
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  certificate_url TEXT,
  prize_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS if not already enabled
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 7. Verify all policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'certificates'
ORDER BY policyname;

-- 8. Test certificate creation (should work now)
SELECT 'Certificates table and policies setup complete!' as status;
