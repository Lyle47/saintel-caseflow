import React, { useState } from 'react';
import { useCaseDetails } from '@/hooks/useCases';
import { useCaseExport } from '@/hooks/useCaseExport';
import { CaseDocuments } from '@/components/CaseDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Clock, 
  User, 
  Calendar,
  Phone,
  MapPin,
  FileText,
  Plus,
  MessageSquare,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CaseDetailsViewProps {
  caseId: string;
  onBack: () => void;
}

export function CaseDetailsView({ caseId, onBack }: CaseDetailsViewProps) {
  const { caseData, activityLog, notes, loading, addNote } = useCaseDetails(caseId);
  const { exportCase } = useCaseExport();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a note before adding.",
      });
      return;
    }

    setAddingNote(true);
    try {
      await addNote(newNote.trim());
      setNewNote('');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading || !caseData) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'closed': return 'outline';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{caseData.title}</h1>
              <p className="text-muted-foreground">Case #{caseData.case_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportCase(caseData)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Case Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Case Overview</span>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(caseData.status)}>
                  {caseData.status.replace('_', ' ')}
                </Badge>
                {caseData.priority && (
                  <Badge variant={getPriorityColor(caseData.priority)}>
                    {caseData.priority}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Case Type
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {caseData.case_type.replace('_', ' ')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Created By
                </div>
                <p className="text-sm text-muted-foreground">
                  {caseData.creator_profile?.full_name || 'Unknown'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(caseData.created_at).toLocaleDateString()}
                </p>
              </div>

              {caseData.assigned_profile && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Assigned To
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {caseData.assigned_profile.full_name}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Last Updated
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(caseData.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {caseData.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {caseData.description}
                  </p>
                </div>
              </>
            )}

            {/* Subject Information */}
            {(caseData.subject_name || caseData.contact_info || caseData.last_known_location || caseData.date_of_birth) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Subject Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseData.subject_name && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4" />
                          Subject Name
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {caseData.subject_name}
                        </p>
                      </div>
                    )}

                    {caseData.date_of_birth && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {caseData.date_of_birth}
                        </p>
                      </div>
                    )}

                    {caseData.contact_info && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-4 w-4" />
                          Contact Information
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {caseData.contact_info}
                        </p>
                      </div>
                    )}

                    {caseData.last_known_location && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4" />
                          Last Known Location
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {caseData.last_known_location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs for detailed information */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity ({activityLog.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <CaseDocuments caseId={caseId} />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            {/* Add Note Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your note here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleAddNote} disabled={addingNote}>
                  {addingNote ? 'Adding...' : 'Add Note'}
                </Button>
              </CardContent>
            </Card>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {note.user_profile?.full_name || 'Unknown User'}
                        </span>
                        {note.is_private && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {note.note}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {notes.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium text-muted-foreground mb-1">No notes yet</h3>
                    <p className="text-sm text-muted-foreground">Add the first note to this case</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-4">
              {activityLog.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {log.user_profile?.full_name || 'System'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.activity_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{log.description}</p>
                    {log.old_values && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Previous:</strong> {JSON.stringify(log.old_values, null, 2)}
                      </div>
                    )}
                    {log.new_values && (
                      <div className="text-xs text-muted-foreground">
                        <strong>New:</strong> {JSON.stringify(log.new_values, null, 2)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {activityLog.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium text-muted-foreground mb-1">No activity yet</h3>
                    <p className="text-sm text-muted-foreground">Case activity will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}