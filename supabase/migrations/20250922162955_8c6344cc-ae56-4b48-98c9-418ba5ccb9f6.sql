-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles simple" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile simple" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles simple" ON public.profiles;

-- Create a security definer function to get current user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Use a direct query to avoid RLS recursion
    SELECT role::TEXT INTO user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(user_role, 'readonly');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create simple, non-recursive policies using the security definer function
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can update own profile or admins can update all" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR public.get_current_user_role() = 'admin'
);

-- Update the get_user_role function to use the new security definer approach
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_role, 'readonly'::user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;