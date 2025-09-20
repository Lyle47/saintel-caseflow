import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const { toast } = useToast();

  const sendNotification = async (
    type: 'case_created' | 'case_updated' | 'case_assigned' | 'case_status_changed',
    caseId: string,
    options?: {
      recipientEmail?: string;
      recipientRole?: string;
      message?: string;
      caseData?: any;
    }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type,
          caseId,
          ...options,
        },
      });

      if (error) {
        console.error('Notification error:', error);
        toast({
          variant: "destructive",
          title: "Notification failed",
          description: "Failed to send email notification",
        });
        return { success: false, error };
      }

      console.log('Notification sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected notification error:', error);
      toast({
        variant: "destructive",
        title: "Notification failed", 
        description: "An unexpected error occurred while sending notification",
      });
      return { success: false, error };
    }
  };

  return { sendNotification };
};