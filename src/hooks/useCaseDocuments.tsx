import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CaseDocument {
  id: string;
  case_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export const useCaseDocuments = (caseId: string | undefined) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!caseId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch case documents.",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!caseId || !user) return null;

    try {
      setLoading(true);
      
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { data, error } = await supabase
        .from('case_documents')
        .insert([{
          case_id: caseId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => [data, ...prev]);
      toast({
        title: "Document uploaded",
        description: "Document has been uploaded successfully.",
      });

      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload document.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: CaseDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Document download has started.",
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message || "Failed to download document.",
      });
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('case_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete document.",
      });
      return false;
    }
  };

  useEffect(() => {
    if (caseId && user) {
      fetchDocuments();
    }
  }, [caseId, user]);

  return {
    documents,
    loading,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    fetchDocuments,
  };
};