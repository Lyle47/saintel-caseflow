-- Create enum types for roles and case status
CREATE TYPE public.user_role AS ENUM ('admin', 'investigator', 'volunteer', 'readonly');
CREATE TYPE public.case_status AS ENUM ('open', 'in_progress', 'closed', 'archived');
CREATE TYPE public.activity_type AS ENUM ('created', 'updated', 'assigned', 'status_changed', 'note_added', 'closed', 'archived');

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'readonly',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table with SI-YYYYMM-### format
CREATE TABLE public.cases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    case_type TEXT NOT NULL,
    status case_status NOT NULL DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES public.profiles(user_id),
    created_by UUID NOT NULL REFERENCES public.profiles(user_id),
    date_of_birth DATE,
    contact_info TEXT,
    last_known_location TEXT,
    subject_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create activity logs table for audit trail
CREATE TABLE public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id),
    activity_type activity_type NOT NULL,
    description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case notes table
CREATE TABLE public.case_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id),
    note TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer case limits table
CREATE TABLE public.volunteer_case_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id),
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    case_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_case_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cases
CREATE POLICY "Users can view cases based on role" ON public.cases
    FOR SELECT USING (
        CASE 
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin' THEN true
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'investigator' THEN true
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'volunteer' 
                THEN (assigned_to = auth.uid() OR created_by = auth.uid())
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'readonly' THEN true
            ELSE false
        END
    );

CREATE POLICY "Admins and investigators can insert cases" ON public.cases
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'investigator')
    );

CREATE POLICY "Users can update cases based on role" ON public.cases
    FOR UPDATE USING (
        CASE 
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin' THEN true
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'investigator' THEN true
            WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'volunteer' 
                THEN (assigned_to = auth.uid() OR created_by = auth.uid())
            ELSE false
        END
    );

-- RLS Policies for activity logs
CREATE POLICY "Users can view activity logs for accessible cases" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE cases.id = activity_logs.case_id 
            AND (
                CASE 
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin' THEN true
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'investigator' THEN true
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'volunteer' 
                        THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'readonly' THEN true
                    ELSE false
                END
            )
        )
    );

CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for case notes
CREATE POLICY "Users can view case notes for accessible cases" ON public.case_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE cases.id = case_notes.case_id 
            AND (
                CASE 
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin' THEN true
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'investigator' THEN true
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'volunteer' 
                        THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'readonly' THEN true
                    ELSE false
                END
            )
        )
        AND (is_private = false OR user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
    );

CREATE POLICY "Users can insert case notes for accessible cases" ON public.case_notes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.cases 
            WHERE cases.id = case_notes.case_id 
            AND (
                CASE 
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin' THEN true
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'investigator' THEN true
                    WHEN (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'volunteer' 
                        THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
                    ELSE false
                END
            )
        )
    );

-- RLS Policies for volunteer case limits
CREATE POLICY "Users can view their own case limits" ON public.volunteer_case_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all case limits" ON public.volunteer_case_limits
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "System can manage case limits" ON public.volunteer_case_limits
    FOR ALL USING (true);

-- Create function to generate case numbers
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at
    BEFORE UPDATE ON public.case_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log case activities
CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for case activity logging
CREATE TRIGGER log_case_changes
    AFTER INSERT OR UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.log_case_activity();

-- Create function to check volunteer case limits
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
        
        -- Update or insert volunteer case limit record
        INSERT INTO public.volunteer_case_limits (user_id, month_year, case_count)
        VALUES (NEW.assigned_to, current_month, case_count + 1)
        ON CONFLICT (user_id, month_year) 
        DO UPDATE SET case_count = case_count + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for volunteer case limit checking
CREATE TRIGGER check_volunteer_limit
    BEFORE INSERT OR UPDATE OF assigned_to ON public.cases
    FOR EACH ROW 
    WHEN (NEW.assigned_to IS NOT NULL)
    EXECUTE FUNCTION public.check_volunteer_case_limit();

-- Create indexes for better performance
CREATE INDEX idx_cases_case_number ON public.cases(case_number);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_assigned_to ON public.cases(assigned_to);
CREATE INDEX idx_cases_created_by ON public.cases(created_by);
CREATE INDEX idx_cases_created_at ON public.cases(created_at);
CREATE INDEX idx_activity_logs_case_id ON public.activity_logs(case_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX idx_case_notes_case_id ON public.case_notes(case_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);