-- Fix the admin profiles policies to avoid self-reference
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create admin policies using auth.jwt() claims or a different approach
-- For now, let's just allow admins with a hardcoded UUID approach for testing
-- In production, you'd want to manage admin access differently

-- Temporarily disable these policies since they cause recursion
-- Admins will need to be managed through direct SQL or a different mechanism