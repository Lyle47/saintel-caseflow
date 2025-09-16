import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Save, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CaseForm() {
  const { toast } = useToast();
  const [caseNumber] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `SI-${year}${month}-${randomNum}`;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Case Created Successfully",
      description: `Case ${caseNumber} has been registered in the system.`,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Create New Case</CardTitle>
              <p className="text-muted-foreground mt-1">Register a new case in the SageIntel system</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {caseNumber}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject-name">Subject Name *</Label>
                <Input id="subject-name" placeholder="Enter full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-type">Case Type *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="missing-person">Missing Person</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="investigation">General Investigation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Information</Label>
                <Input id="contact" placeholder="Phone number or email" />
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-2">
              <Label htmlFor="location">Last Known Location</Label>
              <Input id="location" placeholder="Address or area description" />
            </div>

            {/* Case Details */}
            <div className="space-y-2">
              <Label htmlFor="description">Case Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Provide detailed description of the case..."
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned-to">Assigned Investigator</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investigator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="det-williams">Det. Williams</SelectItem>
                    <SelectItem value="det-brown">Det. Brown</SelectItem>
                    <SelectItem value="det-davis">Det. Davis</SelectItem>
                    <SelectItem value="det-wilson">Det. Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drop files here or <span className="text-primary cursor-pointer">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: PDF, DOC, JPG, PNG (Max 10MB each)
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                * Required fields
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" type="button">
                  <FileText className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Create Case
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}