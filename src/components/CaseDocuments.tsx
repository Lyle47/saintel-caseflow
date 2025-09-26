import React, { useCallback } from 'react';
import { useCaseDocuments } from '@/hooks/useCaseDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  File,
  AlertTriangle
} from 'lucide-react';

interface CaseDocumentsProps {
  caseId: string;
}

export function CaseDocuments({ caseId }: CaseDocumentsProps) {
  const { documents, loading, uploadDocument, downloadDocument, deleteDocument } = useCaseDocuments(caseId);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 50MB.",
      });
      return;
    }

    await uploadDocument(file);
    // Clear the input
    event.target.value = '';
  }, [uploadDocument, toast]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Case Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="mb-2" disabled={loading}>
                  {loading ? 'Uploading...' : 'Choose File'}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  disabled={loading}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload documents, images, or other files related to this case
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 50MB. Supported formats: PDF, DOC, DOCX, TXT, images
            </p>
          </div>
        </div>

        <Separator />

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-muted-foreground mb-1">No documents uploaded</h3>
            <p className="text-sm text-muted-foreground">Upload your first document using the button above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0">
                  {getFileIcon(document.mime_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{document.file_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(document.file_size)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadDocument(document)}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(document.id, document.file_path)}
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {documents.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-muted-foreground">
              All uploaded documents are securely stored and only accessible to authorized personnel.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}