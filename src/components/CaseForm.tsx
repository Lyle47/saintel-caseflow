import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, FileText, AlertTriangle, User, MapPin, Calendar, Phone } from 'lucide-react';

interface CaseFormProps {
  onBack?: () => void;
}

export function CaseForm({ onBack }: CaseFormProps) {
  const { user, userProfile } = useAuth();
  const { createCase } = useCases();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    case_type: '',
    priority: 'medium',
    subject_name: '',
    date_of_birth: '',
    contact_info: '',
    last_known_location: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.case_type) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in all required fields marked with *",
      });
      return;
    }

    setLoading(true);
    try {
      await createCase({
        ...formData,
        created_by: user?.id || '',
        status: 'open', // Default status for new cases
      });
      
      toast({
        title: "Case created successfully",
        description: "The new case has been added to the system.",
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        case_type: '',
        priority: 'medium',
        subject_name: '',
        date_of_birth: '',
        contact_info: '',
        last_known_location: '',
      });
      
      if (onBack) onBack();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating case",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check permissions
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'investigator') {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to create cases. Only administrators and investigators can create new cases.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="hidden md:flex">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Create New Case</h1>
            <p className="text-sm md:text-base text-muted-foreground">Fill in the details to create a new investigation case</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-sm">
                Essential case details and classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Case Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter case title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="case_type" className="text-sm font-medium">Case Type *</Label>
                  <Select value={formData.case_type} onValueChange={(value) => handleInputChange('case_type', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="missing_person">Missing Person</SelectItem>
                      <SelectItem value="fraud">Fraud Investigation</SelectItem>
                      <SelectItem value="background_check">Background Check</SelectItem>
                      <SelectItem value="surveillance">Surveillance</SelectItem>
                      <SelectItem value="insurance_claim">Insurance Claim</SelectItem>
                      <SelectItem value="corporate">Corporate Investigation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Priority Level
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Case Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the case..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subject Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <User className="h-5 w-5" />
                Subject Information
              </CardTitle>
              <CardDescription className="text-sm">
                Details about the person or entity being investigated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_name" className="text-sm font-medium">Subject Name</Label>
                  <Input
                    id="subject_name"
                    placeholder="Full name of the subject"
                    value={formData.subject_name}
                    onChange={(e) => handleInputChange('subject_name', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_info" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </Label>
                  <Textarea
                    id="contact_info"
                    placeholder="Phone numbers, email addresses, etc."
                    value={formData.contact_info}
                    onChange={(e) => handleInputChange('contact_info', e.target.value)}
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_known_location" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Last Known Location
                  </Label>
                  <Textarea
                    id="last_known_location"
                    placeholder="Address, city, or general area"
                    value={formData.last_known_location}
                    onChange={(e) => handleInputChange('last_known_location', e.target.value)}
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {onBack && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack} 
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating Case...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}