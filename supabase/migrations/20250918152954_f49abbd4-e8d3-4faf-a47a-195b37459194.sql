-- Fix function search paths for security compliance

-- Update generate_case_number function
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_month TEXT;
    sequence_num INTEGER;
    case_number TEXT;
BEGIN
    -- Get current month in YYYYMM format
    current_month := to_char(now(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(RIGHT(case_number, 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.cases
    WHERE case_number LIKE 'SI-' || current_month || '-%';
    
    -- Format the case number
    case_number := 'SI-' || current_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN case_number;
END;
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'readonly'
    );
    RETURN NEW;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update log_case_activity function
CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    activity_description TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user id
    current_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        activity_description := 'Case created';
        INSERT INTO public.activity_logs (case_id, user_id, activity_type, description, new_values)
        VALUES (NEW.id, current_user_id, 'created', activity_description, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check what changed and log accordingly
        IF OLD.status != NEW.status THEN
            activity_description := 'Status changed from ' || OLD.status || ' to ' || NEW.status;
            INSERT INTO public.activity_logs (case_id, user_id, activity_type, description, old_values, new_values)
            VALUES (NEW.id, current_user_id, 'status_changed', activity_description, 
                   jsonb_build_object('status', OLD.status), 
                   jsonb_build_object('status', NEW.status));
        END IF;
        
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            activity_description := 'Case assignment changed';
            INSERT INTO public.activity_logs (case_id, user_id, activity_type, description, old_values, new_values)
            VALUES (NEW.id, current_user_id, 'assigned', activity_description,
                   jsonb_build_object('assigned_to', OLD.assigned_to),
                   jsonb_build_object('assigned_to', NEW.assigned_to));
        END IF;
        
        -- Log general update if other fields changed
        IF OLD.title != NEW.title OR OLD.description IS DISTINCT FROM NEW.description OR 
           OLD.case_type != NEW.case_type OR OLD.priority IS DISTINCT FROM NEW.priority THEN
            activity_description := 'Case details updated';
            INSERT INTO public.activity_logs (case_id, user_id, activity_type, description, old_values, new_values)
            VALUES (NEW.id, current_user_id, 'updated', activity_description,
                   to_jsonb(OLD), to_jsonb(NEW));
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Update check_volunteer_case_limit function
CREATE OR REPLACE FUNCTION public.check_volunteer_case_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        
        -- Update or insert volunteer case limit record
        INSERT INTO public.volunteer_case_limits (user_id, month_year, case_count)
        VALUES (NEW.assigned_to, current_month, case_count + 1)
        ON CONFLICT (user_id, month_year) 
        DO UPDATE SET case_count = case_count + 1;
    END IF;
    
    RETURN NEW;
END;
$$;