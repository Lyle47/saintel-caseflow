import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Case, ActivityLog, CaseNote } from '@/hooks/useCases';
import { CaseDocument } from '@/hooks/useCaseDocuments';

export const useCaseExport = () => {
  const { toast } = useToast();

  const exportCase = async (caseData: Case) => {
    try {
      toast({
        title: "Preparing export",
        description: "Gathering case data for export...",
      });

      // Fetch additional data
      const [activityResponse, notesResponse, documentsResponse] = await Promise.all([
        supabase
          .from('activity_logs')
          .select(`
            *,
            user_profile:profiles!activity_logs_user_id_fkey(full_name, email)
          `)
          .eq('case_id', caseData.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('case_notes')
          .select(`
            *,
            user_profile:profiles!case_notes_user_id_fkey(full_name, email)
          `)
          .eq('case_id', caseData.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('case_documents')
          .select('*')
          .eq('case_id', caseData.id)
          .order('created_at', { ascending: false })
      ]);

      const activityLogs = activityResponse.data || [];
      const notes = notesResponse.data || [];
      const documents = documentsResponse.data || [];

      // Generate comprehensive case report
      const reportContent = generateCaseReport(caseData, activityLogs, notes, documents);
      
      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `Case_${caseData.case_number}_Export.txt`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `Case ${caseData.case_number} exported successfully. Password: ${caseData.case_number}`,
      });

    } catch (error: any) {
      console.error('Error exporting case:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export case data.",
      });
    }
  };

  return { exportCase };
};

function generateCaseReport(
  caseData: Case, 
  activityLogs: ActivityLog[], 
  notes: CaseNote[], 
  documents: CaseDocument[]
): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return `
================================================================================
                             CASE EXPORT REPORT
================================================================================

CASE INFORMATION:
--------------------------------------------------------------------------------
Case Number:        ${caseData.case_number}
Title:              ${caseData.title}
Case Type:          ${caseData.case_type}
Status:             ${caseData.status}
Priority:           ${caseData.priority || 'Medium'}
Created:            ${formatDate(caseData.created_at)}
Last Updated:       ${formatDate(caseData.updated_at)}
${caseData.closed_at ? `Closed:             ${formatDate(caseData.closed_at)}` : ''}
${caseData.archived_at ? `Archived:           ${formatDate(caseData.archived_at)}` : ''}

PERSONNEL:
--------------------------------------------------------------------------------
Created By:         ${caseData.creator_profile?.full_name || 'Unknown'} (${caseData.creator_profile?.email || 'N/A'})
${caseData.assigned_profile ? `Assigned To:        ${caseData.assigned_profile.full_name} (${caseData.assigned_profile.email})` : 'Not Assigned'}

SUBJECT INFORMATION:
--------------------------------------------------------------------------------
${caseData.subject_name ? `Subject Name:       ${caseData.subject_name}` : 'No subject name provided'}
${caseData.date_of_birth ? `Date of Birth:      ${caseData.date_of_birth}` : 'No date of birth provided'}
${caseData.contact_info ? `Contact Info:       ${caseData.contact_info}` : 'No contact information provided'}
${caseData.last_known_location ? `Last Known Location: ${caseData.last_known_location}` : 'No location information provided'}

CASE DESCRIPTION:
--------------------------------------------------------------------------------
${caseData.description || 'No description provided'}

CASE DOCUMENTS (${documents.length}):
--------------------------------------------------------------------------------
${documents.length > 0 ? documents.map(doc => 
`- ${doc.file_name} (${(doc.file_size / 1024 / 1024).toFixed(2)} MB) - Uploaded: ${formatDate(doc.created_at)}`
).join('\n') : 'No documents attached'}

ACTIVITY LOG (${activityLogs.length} entries):
--------------------------------------------------------------------------------
${activityLogs.length > 0 ? activityLogs.map(log => 
`${formatDate(log.created_at)} - ${log.user_profile?.full_name || 'Unknown User'}
Type: ${log.activity_type.toUpperCase()}
${log.description}
${log.old_values ? `Previous: ${JSON.stringify(log.old_values, null, 2)}` : ''}
${log.new_values ? `New: ${JSON.stringify(log.new_values, null, 2)}` : ''}
`).join('\n--------------------------------------------------------------------------------\n') : 'No activity recorded'}

CASE NOTES (${notes.length} entries):
--------------------------------------------------------------------------------
${notes.length > 0 ? notes.map(note => 
`${formatDate(note.created_at)} - ${note.user_profile?.full_name || 'Unknown User'} ${note.is_private ? '(PRIVATE)' : '(PUBLIC)'}
${note.note}
`).join('\n--------------------------------------------------------------------------------\n') : 'No notes recorded'}

================================================================================
                        END OF CASE EXPORT REPORT
                         Password: ${caseData.case_number}
================================================================================

IMPORTANT SECURITY NOTICE:
This file contains sensitive case information. The password for this export is 
the case number: ${caseData.case_number}

Generated on: ${formatDate(new Date().toISOString())}
Export Type: Complete Case Data Export
Confidentiality: RESTRICTED
`;
}