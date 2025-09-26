import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Users,
  Activity,
  BarChart3,
  Plus,
  MoreHorizontal,
  Download
} from "lucide-react";
import { useCases } from "@/hooks/useCases";
import { useCaseExport } from "@/hooks/useCaseExport";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CaseFilters } from "@/components/CaseFilters";
import { CaseAnalytics } from "@/components/CaseAnalytics";

interface DashboardProps {
  onCreateCase?: () => void;
  onViewCase?: (caseData: any) => void;
}

export function Dashboard({ onCreateCase, onViewCase }: DashboardProps) {
  const { cases, loading, fetchCases } = useCases();
  const { exportCase } = useCaseExport();
  const { userProfile } = useAuth();
  const [filteredCases, setFilteredCases] = useState(cases);
  const [stats, setStats] = useState([
    { title: "Total Cases", value: "0", change: "0%", trend: "up", icon: FileText, color: "text-primary" },
    { title: "Open Cases", value: "0", change: "0%", trend: "up", icon: Clock, color: "text-warning" },
    { title: "In Progress", value: "0", change: "0%", trend: "up", icon: AlertTriangle, color: "text-accent" },
    { title: "Closed Cases", value: "0", change: "0%", trend: "up", icon: CheckCircle, color: "text-success" }
  ]);

  useEffect(() => {
    setFilteredCases(cases);
    if (cases.length > 0) {
      const totalCases = cases.length;
      const openCases = cases.filter(c => c.status === 'open').length;
      const inProgressCases = cases.filter(c => c.status === 'in_progress').length;
      const closedCases = cases.filter(c => c.status === 'closed').length;

      setStats([
        {
          title: "Total Cases",
          value: totalCases.toString(),
          change: "+12%",
          trend: "up" as const,
          icon: FileText,
          color: "text-primary"
        },
        {
          title: "Open Cases", 
          value: openCases.toString(),
          change: "+8%",
          trend: "up" as const,
          icon: Clock,
          color: "text-warning"
        },
        {
          title: "In Progress",
          value: inProgressCases.toString(),
          change: "+15%",
          trend: "up" as const,
          icon: AlertTriangle,
          color: "text-accent"
        },
        {
          title: "Closed Cases",
          value: closedCases.toString(),
          change: "+6%",
          trend: "up" as const,
          icon: CheckCircle,
          color: "text-success"
        }
      ]);
    }
  }, [cases]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'closed': return 'outline';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'closed': return 'Closed';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleFiltersChange = (filters: any) => {
    let filtered = [...cases];

    if (filters.search) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.case_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters.case_type) {
      filtered = filtered.filter(c => c.case_type === filters.case_type);
    }

    if (filters.priority) {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(c => c.assigned_to === filters.assignedTo);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(c => new Date(c.created_at) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(c => new Date(c.created_at) <= new Date(filters.dateTo));
    }

    setFilteredCases(filtered);
  };

  const handleNewCase = () => {
    if (onCreateCase) {
      onCreateCase();
    } else {
      console.log('Navigate to new case form');
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Case Number', 'Title', 'Status', 'Priority', 'Type', 'Created Date', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredCases.map(case_ => [
        case_.case_number,
        `"${case_.title}"`,
        case_.status,
        case_.priority || '',
        case_.case_type.replace('_', ' '),
        new Date(case_.created_at).toLocaleDateString(),
        new Date(case_.updated_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {loading ? (
        <div className="space-y-6">
          {/* Loading Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
          
          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {userProfile?.full_name || 'User'}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Here's your case management overview
              </p>
            </div>
            {(userProfile?.role === 'admin' || userProfile?.role === 'investigator') && (
              <Button onClick={handleNewCase} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs md:text-sm">{stat.title}</CardDescription>
                    <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-bold">{stat.value}</CardTitle>
                  {stat.change && (
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-green-600">{stat.change}</span>
                    </div>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="cases" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cases" className="text-sm">Cases</TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cases" className="space-y-6">
              <CaseFilters
                onFiltersChange={handleFiltersChange}
                totalCount={filteredCases.length}
                loading={false}
                onRefresh={fetchCases}
                onExport={handleExport}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Recent Cases</CardTitle>
                  <CardDescription className="text-sm">
                    Latest investigation cases and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-4">
                    {filteredCases.slice(0, 10).map((case_) => (
                      <Card key={case_.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {case_.case_number}
                                </Badge>
                                <Badge variant={getStatusColor(case_.status)} className="text-xs">
                                  {getStatusLabel(case_.status)}
                                </Badge>
                              </div>
                              <h3 className="font-medium text-sm truncate">{case_.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                {case_.case_type.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => onViewCase?.(case_)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => exportCase(case_)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {case_.priority && (
                                <Badge variant={getPriorityVariant(case_.priority)} className="text-xs">
                                  {case_.priority}
                                </Badge>
                              )}
                            </div>
                            <span>{new Date(case_.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Case #</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[100px]">Priority</TableHead>
                            <TableHead className="w-[120px]">Type</TableHead>
                            <TableHead className="w-[140px]">Assignee</TableHead>
                            <TableHead className="w-[120px]">Last Update</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCases.slice(0, 10).map((case_) => (
                            <TableRow key={case_.id}>
                              <TableCell className="font-mono text-sm">
                                {case_.case_number}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[200px] truncate font-medium">
                                  {case_.title}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(case_.status)}>
                                  {getStatusLabel(case_.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {case_.priority ? (
                                  <Badge variant={getPriorityVariant(case_.priority)}>
                                    {case_.priority}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="capitalize">
                                {case_.case_type.replace('_', ' ')}
                              </TableCell>
                              <TableCell>
                                {case_.assigned_profile ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-xs font-medium">
                                        {case_.assigned_profile.full_name?.charAt(0) || '?'}
                                      </span>
                                    </div>
                                    <span className="text-sm truncate max-w-[80px]">
                                      {case_.assigned_profile.full_name || 'Unknown'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(case_.updated_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => onViewCase?.(case_)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => exportCase(case_)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <CaseAnalytics cases={cases} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}