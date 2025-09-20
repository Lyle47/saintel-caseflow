import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  status: 'open' | 'in_progress' | 'closed' | 'archived';
  priority?: string;
  assigned_to?: string;
  created_by: string;
  date_of_birth?: string;
  contact_info?: string;
  last_known_location?: string;
  subject_name?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  archived_at?: string;
  assigned_profile?: {
    full_name: string;
    email: string;
  } | null;
  creator_profile?: {
    full_name: string;
    email: string;
  } | null;
}

export interface ActivityLog {
  id: string;
  case_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export interface CaseNote {
  id: string;
  case_id: string;
  user_id: string;
  note: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export const useCases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { sendNotification } = useNotifications();

  const fetchCases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          assigned_profile:profiles!cases_assigned_to_fkey(full_name, email),
          creator_profile:profiles!cases_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases((data || []) as Case[]);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cases.",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCase = async (caseData: Omit<Case, 'id' | 'case_number' | 'created_at' | 'updated_at' | 'assigned_profile' | 'creator_profile'>) => {
    if (!user) return null;

    try {
      // Generate case number
      const { data: caseNumber, error: numberError } = await supabase
        .rpc('generate_case_number');

      if (numberError) throw numberError;

      const { data, error } = await supabase
        .from('cases')
        .insert([{
          ...caseData,
          case_number: caseNumber,
          created_by: user.id,
        }])
        .select(`
          *,
          assigned_profile:profiles!cases_assigned_to_fkey(full_name, email),
          creator_profile:profiles!cases_created_by_fkey(full_name, email)
        `)
        .single();

      if (error) throw error;

      setCases(prev => [data as Case, ...prev]);
      toast({
        title: "Case created",
        description: `Case ${data.case_number} has been created successfully.`,
      });

      // Send notification for new case
      sendNotification('case_created', data.id);

      return data;
    } catch (error: any) {
      console.error('Error creating case:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create case.",
      });
      return null;
    }
  };

  const updateCase = async (caseId: string, updates: Partial<Case>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('cases')
        .update(updates)
        .eq('id', caseId)
        .select(`
          *,
          assigned_profile:profiles!cases_assigned_to_fkey(full_name, email),
          creator_profile:profiles!cases_created_by_fkey(full_name, email)
        `)
        .single();

      if (error) throw error;

      setCases(prev => prev.map(c => c.id === caseId ? data as Case : c));
      toast({
        title: "Case updated",
        description: "Case has been updated successfully.",
      });

      // Send notifications for status changes or assignments
      if (updates.status) {
        sendNotification('case_status_changed', caseId);
      }
      if (updates.assigned_to) {
        sendNotification('case_assigned', caseId);
      }

      return data;
    } catch (error: any) {
      console.error('Error updating case:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update case.",
      });
      return null;
    }
  };

  const deleteCase = async (caseId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      setCases(prev => prev.filter(c => c.id !== caseId));
      toast({
        title: "Case deleted",
        description: "Case has been deleted successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting case:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete case.",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user]);

  return {
    cases,
    loading,
    fetchCases,
    createCase,
    updateCase,
    deleteCase,
  };
};

export const useCaseDetails = (caseId: string | undefined) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCaseDetails = async () => {
    if (!caseId || !user) return;

    try {
      setLoading(true);
      
      // Fetch case details
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          *,
          assigned_profile:profiles!cases_assigned_to_fkey(full_name, email),
          creator_profile:profiles!cases_created_by_fkey(full_name, email)
        `)
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseData as Case);

      // Fetch activity log
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user_profile:profiles!activity_logs_user_id_fkey(full_name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (activityError) throw activityError;
      setActivityLog(activityData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('case_notes')
        .select(`
          *,
          user_profile:profiles!case_notes_user_id_fkey(full_name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

    } catch (error) {
      console.error('Error fetching case details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch case details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (note: string, isPrivate: boolean = false) => {
    if (!caseId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('case_notes')
        .insert([{
          case_id: caseId,
          user_id: user.id,
          note,
          is_private: isPrivate,
        }])
        .select(`
          *,
          user_profile:profiles!case_notes_user_id_fkey(full_name, email)
        `)
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      toast({
        title: "Note added",
        description: "Note has been added successfully.",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add note.",
      });
      return null;
    }
  };

  useEffect(() => {
    if (caseId && user) {
      fetchCaseDetails();
    }
  }, [caseId, user]);

  return {
    caseData,
    activityLog,
    notes,
    loading,
    fetchCaseDetails,
    addNote,
  };
};