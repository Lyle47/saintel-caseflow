-- Drop all existing policies on volunteer_case_limits table
DROP POLICY IF EXISTS "System can manage case limits" ON public.volunteer_case_limits;
DROP POLICY IF EXISTS "Admins can view all case limits" ON public.volunteer_case_limits;
DROP POLICY IF EXISTS "Users can view their own case limits" ON public.volunteer_case_limits;
DROP POLICY IF EXISTS "Users can insert their own case limits" ON public.volunteer_case_limits;
DROP POLICY IF EXISTS "Users can update their own case limits" ON public.volunteer_case_limits;
DROP POLICY IF EXISTS "Admins and investigators can manage all case limits" ON public.volunteer_case_limits;

-- Create a security definer function to manage case limits (for database triggers/functions)
CREATE OR REPLACE FUNCTION public.manage_volunteer_case_limit(
    p_user_id UUID,
    p_month_year TEXT,
    p_case_count INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.volunteer_case_limits (user_id, month_year, case_count)
    VALUES (p_user_id, p_month_year, p_case_count)
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET case_count = p_case_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create specific, secure policies for volunteer_case_limits table

-- Users can view their own case limits
CREATE POLICY "Users can view their own case limits" 
ON public.volunteer_case_limits 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own case limit records (needed for manual tracking)
CREATE POLICY "Users can insert their own case limits" 
ON public.volunteer_case_limits 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own case limit records (needed for manual adjustments)
CREATE POLICY "Users can update their own case limits" 
ON public.volunteer_case_limits 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all case limits for monitoring
CREATE POLICY "Admins can view all case limits" 
ON public.volunteer_case_limits 
FOR SELECT 
TO authenticated
USING (
    ( SELECT role FROM public.profiles WHERE user_id = auth.uid() ) = 'admin'
);

-- Admins can manage all case limits for administrative purposes
CREATE POLICY "Admins can manage all case limits" 
ON public.volunteer_case_limits 
FOR ALL 
TO authenticated
USING (
    ( SELECT role FROM public.profiles WHERE user_id = auth.uid() ) = 'admin'
);

-- Update the check_volunteer_case_limit function to use the new security definer function
CREATE OR REPLACE FUNCTION public.check_volunteer_case_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_role user_role;
    current_month TEXT;
    case_count INTEGER;
BEGIN
    -- Get user role
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE user_id = NEW.assigned_to;
    
    -- Only check for volunteers
    IF user_role = 'volunteer' THEN
        current_month := to_char(now(), 'YYYY-MM');
        
        -- Get current case count for this month
        SELECT COALESCE(SUM(CASE WHEN cases.assigned_to = NEW.assigned_to THEN 1 ELSE 0 END), 0)
        INTO case_count
        FROM public.cases
        WHERE assigned_to = NEW.assigned_to 
        AND to_char(created_at, 'YYYY-MM') = current_month
        AND status != 'archived';
        
        -- Check if limit exceeded (5 cases per month)
        IF case_count >= 5 THEN
            RAISE EXCEPTION 'Volunteer case limit exceeded. Maximum 5 cases per month allowed.';
        END IF;
        
        -- Use the secure function to update case limits
        PERFORM public.manage_volunteer_case_limit(NEW.assigned_to, current_month, case_count + 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;