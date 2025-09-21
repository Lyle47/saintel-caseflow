-- Fix infinite recursion in RLS policies by creating simple policies for profiles table
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view their own profile simple" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile simple" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Update other policies to use the function instead of subqueries
-- Update cases policies
DROP POLICY IF EXISTS "Users can view cases based on role" ON public.cases;
CREATE POLICY "Users can view cases based on role" 
ON public.cases FOR SELECT 
USING (
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'admin' THEN true
    WHEN public.get_user_role(auth.uid()) = 'investigator' THEN true
    WHEN public.get_user_role(auth.uid()) = 'volunteer' THEN (assigned_to = auth.uid() OR created_by = auth.uid())
    WHEN public.get_user_role(auth.uid()) = 'readonly' THEN true
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can update cases based on role" ON public.cases;
CREATE POLICY "Users can update cases based on role" 
ON public.cases FOR UPDATE 
USING (
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'admin' THEN true
    WHEN public.get_user_role(auth.uid()) = 'investigator' THEN true
    WHEN public.get_user_role(auth.uid()) = 'volunteer' THEN (assigned_to = auth.uid() OR created_by = auth.uid())
    ELSE false
  END
);

-- Update activity_logs policies
DROP POLICY IF EXISTS "Users can view activity logs for accessible cases" ON public.activity_logs;
CREATE POLICY "Users can view activity logs for accessible cases" 
ON public.activity_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = activity_logs.case_id 
    AND CASE 
      WHEN public.get_user_role(auth.uid()) = 'admin' THEN true
      WHEN public.get_user_role(auth.uid()) = 'investigator' THEN true
      WHEN public.get_user_role(auth.uid()) = 'volunteer' THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
      WHEN public.get_user_role(auth.uid()) = 'readonly' THEN true
      ELSE false
    END
  )
);

-- Update case_notes policies
DROP POLICY IF EXISTS "Users can view case notes for accessible cases" ON public.case_notes;
CREATE POLICY "Users can view case notes for accessible cases" 
ON public.case_notes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_notes.case_id 
    AND CASE 
      WHEN public.get_user_role(auth.uid()) = 'admin' THEN true
      WHEN public.get_user_role(auth.uid()) = 'investigator' THEN true
      WHEN public.get_user_role(auth.uid()) = 'volunteer' THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
      WHEN public.get_user_role(auth.uid()) = 'readonly' THEN true
      ELSE false
    END
  )
  AND (
    is_private = false 
    OR user_id = auth.uid() 
    OR public.get_user_role(auth.uid()) = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can insert case notes for accessible cases" ON public.case_notes;
CREATE POLICY "Users can insert case notes for accessible cases" 
ON public.case_notes FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_notes.case_id 
    AND CASE 
      WHEN public.get_user_role(auth.uid()) = 'admin' THEN true
      WHEN public.get_user_role(auth.uid()) = 'investigator' THEN true
      WHEN public.get_user_role(auth.uid()) = 'volunteer' THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
      ELSE false
    END
  )
);

-- Update volunteer_case_limits policies
DROP POLICY IF EXISTS "Admins can view all case limits" ON public.volunteer_case_limits;
CREATE POLICY "Admins can view all case limits" 
ON public.volunteer_case_limits FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage all case limits" ON public.volunteer_case_limits;
CREATE POLICY "Admins can manage all case limits" 
ON public.volunteer_case_limits FOR ALL
USING (public.get_user_role(auth.uid()) = 'admin');