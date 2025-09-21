-- Add admin policy for profiles to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles simple" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR auth.uid() = user_id
);

-- Drop the old simple policy and replace with the comprehensive one
DROP POLICY IF EXISTS "Users can view their own profile simple" ON public.profiles;

-- Also add admin update policy
CREATE POLICY "Admins can update all profiles simple" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR auth.uid() = user_id
);