import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'case_created' | 'case_updated' | 'case_assigned' | 'case_status_changed';
  caseId: string;
  recipientEmail?: string;
  recipientRole?: string;
  message?: string;
  caseData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Notification function called');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      type, 
      caseId, 
      recipientEmail, 
      recipientRole, 
      message,
      caseData 
    }: NotificationRequest = await req.json();

    console.log('Processing notification:', { type, caseId, recipientRole });

    // Get case details
    const { data: caseDetails, error: caseError } = await supabaseClient
      .from('cases')
      .select(`
        *,
        created_by_profile:profiles!cases_created_by_fkey(full_name, email),
        assigned_to_profile:profiles!cases_assigned_to_fkey(full_name, email)
      `)
      .eq('id', caseId)
      .single();

    if (caseError) {
      console.error('Error fetching case details:', caseError);
      throw new Error('Failed to fetch case details');
    }

    console.log('Case details fetched:', caseDetails?.case_number);

    let recipients: string[] = [];
    let subject = '';
    let htmlContent = '';

    // Determine recipients and content based on notification type
    switch (type) {
      case 'case_created':
        // Notify all investigators and admins
        const { data: investigators } = await supabaseClient
          .from('profiles')
          .select('email, full_name')
          .in('role', ['admin', 'investigator'])
          .eq('is_active', true);

        recipients = investigators?.map(inv => inv.email) || [];
        subject = `New Case Created: ${caseDetails.case_number}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">SageIntel Case Management</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">New Case Created</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p><strong>Case Number:</strong> ${caseDetails.case_number}</p>
                <p><strong>Title:</strong> ${caseDetails.title}</p>
                <p><strong>Type:</strong> ${caseDetails.case_type}</p>
                <p><strong>Priority:</strong> ${caseDetails.priority || 'Medium'}</p>
                <p><strong>Status:</strong> ${caseDetails.status}</p>
                ${caseDetails.subject_name ? `<p><strong>Subject:</strong> ${caseDetails.subject_name}</p>` : ''}
                ${caseDetails.description ? `<p><strong>Description:</strong> ${caseDetails.description}</p>` : ''}
                <p><strong>Created by:</strong> ${caseDetails.created_by_profile?.full_name}</p>
                <p><strong>Created at:</strong> ${new Date(caseDetails.created_at).toLocaleString()}</p>
              </div>
              <p style="margin-top: 20px; color: #666;">Please log in to the SageIntel system to review and manage this case.</p>
            </div>
          </div>
        `;
        break;

      case 'case_assigned':
        if (caseDetails.assigned_to_profile?.email) {
          recipients = [caseDetails.assigned_to_profile.email];
          subject = `Case Assigned to You: ${caseDetails.case_number}`;
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">SageIntel Case Management</h1>
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                <h2 style="color: #333; margin-bottom: 20px;">Case Assigned to You</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <p>Hello ${caseDetails.assigned_to_profile.full_name},</p>
                  <p>A case has been assigned to you:</p>
                  <p><strong>Case Number:</strong> ${caseDetails.case_number}</p>
                  <p><strong>Title:</strong> ${caseDetails.title}</p>
                  <p><strong>Type:</strong> ${caseDetails.case_type}</p>
                  <p><strong>Priority:</strong> ${caseDetails.priority || 'Medium'}</p>
                  ${caseDetails.subject_name ? `<p><strong>Subject:</strong> ${caseDetails.subject_name}</p>` : ''}
                  ${caseDetails.description ? `<p><strong>Description:</strong> ${caseDetails.description}</p>` : ''}
                </div>
                <p style="margin-top: 20px; color: #666;">Please log in to the SageIntel system to begin working on this case.</p>
              </div>
            </div>
          `;
        }
        break;

      case 'case_status_changed':
        // Notify case creator and assigned person
        const notifyEmails = [];
        if (caseDetails.created_by_profile?.email) notifyEmails.push(caseDetails.created_by_profile.email);
        if (caseDetails.assigned_to_profile?.email && caseDetails.assigned_to_profile.email !== caseDetails.created_by_profile?.email) {
          notifyEmails.push(caseDetails.assigned_to_profile.email);
        }
        
        recipients = notifyEmails;
        subject = `Case Status Updated: ${caseDetails.case_number}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">SageIntel Case Management</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Case Status Updated</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p><strong>Case Number:</strong> ${caseDetails.case_number}</p>
                <p><strong>Title:</strong> ${caseDetails.title}</p>
                <p><strong>New Status:</strong> ${caseDetails.status}</p>
                ${message ? `<p><strong>Update:</strong> ${message}</p>` : ''}
                <p><strong>Last Updated:</strong> ${new Date(caseDetails.updated_at).toLocaleString()}</p>
              </div>
              <p style="margin-top: 20px; color: #666;">Log in to the SageIntel system for more details.</p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error('Invalid notification type');
    }

    // Send emails if we have recipients
    if (recipients.length > 0) {
      console.log(`Sending ${type} notification to:`, recipients);
      
      const emailPromises = recipients.map(async (email) => {
        return resend.emails.send({
          from: 'SageIntel <noreply@sageintel.co.za>',
          to: [email],
          subject: subject,
          html: htmlContent,
        });
      });

      const results = await Promise.allSettled(emailPromises);
      console.log('Email sending results:', results);

      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some emails failed to send:', failures);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${recipients.length} recipients`,
        type,
        caseNumber: caseDetails.case_number
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);