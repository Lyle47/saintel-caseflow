-- Create storage bucket for case documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('case-documents', 'case-documents', false, 52428800, ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']);

-- Create case_documents table to track uploaded files
CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on case_documents
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
ALTER TABLE public.case_documents 
ADD CONSTRAINT case_documents_case_id_fkey 
FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;

-- Create RLS policies for case_documents
CREATE POLICY "Users can view case documents for accessible cases" 
ON public.case_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.cases 
  WHERE cases.id = case_documents.case_id 
  AND (
    CASE
      WHEN get_user_role(auth.uid()) = 'admin'::user_role THEN true
      WHEN get_user_role(auth.uid()) = 'investigator'::user_role THEN true
      WHEN get_user_role(auth.uid()) = 'volunteer'::user_role THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
      WHEN get_user_role(auth.uid()) = 'readonly'::user_role THEN true
      ELSE false
    END
  )
));

CREATE POLICY "Users can upload case documents for accessible cases" 
ON public.case_documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by 
  AND EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = case_documents.case_id 
    AND (
      CASE
        WHEN get_user_role(auth.uid()) = 'admin'::user_role THEN true
        WHEN get_user_role(auth.uid()) = 'investigator'::user_role THEN true
        WHEN get_user_role(auth.uid()) = 'volunteer'::user_role THEN (cases.assigned_to = auth.uid() OR cases.created_by = auth.uid())
        ELSE false
      END
    )
  )
);

-- Create storage policies for case documents
CREATE POLICY "Users can view case documents they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents' 
  AND EXISTS (
    SELECT 1 FROM public.case_documents cd
    JOIN public.cases c ON c.id = cd.case_id
    WHERE cd.file_path = name
    AND (
      CASE
        WHEN get_user_role(auth.uid()) = 'admin'::user_role THEN true
        WHEN get_user_role(auth.uid()) = 'investigator'::user_role THEN true
        WHEN get_user_role(auth.uid()) = 'volunteer'::user_role THEN (c.assigned_to = auth.uid() OR c.created_by = auth.uid())
        WHEN get_user_role(auth.uid()) = 'readonly'::user_role THEN true
        ELSE false
      END
    )
  )
);

CREATE POLICY "Users can upload case documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own case documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'case-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for updated_at on case_documents
CREATE TRIGGER update_case_documents_updated_at
  BEFORE UPDATE ON public.case_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();