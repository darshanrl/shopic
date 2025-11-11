-- Drop existing restrictive policies for entries
DROP POLICY IF EXISTS "Anyone can view approved entries" ON public.entries;
DROP POLICY IF EXISTS "Users can view own entries" ON public.entries;

-- Create new policy that allows everyone to see all entries
CREATE POLICY "Anyone can view all entries" ON public.entries FOR SELECT USING (true);
