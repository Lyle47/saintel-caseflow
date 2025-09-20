import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus
} from "lucide-react";
import { useCases } from "@/hooks/useCases";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CaseFilters } from "@/components/CaseFilters";
import { CaseAnalytics } from "@/components/CaseAnalytics";

export function Dashboard() {
  const { cases, loading, fetchCases } = useCases();
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
          change: "+0%",
          trend: "up" as const,
          icon: FileText,
          color: "text-primary"
        },
        {
          title: "Open Cases", 
          value: openCases.toString(),
          change: "+0%",
          trend: "up" as const,
          icon: Clock,
          color: "text-warning"
        },
        {
          title: "In Progress",
          value: inProgressCases.toString(),
          change: "+0%",
          trend: "up" as const,
          icon: AlertTriangle,
          color: "text-accent"
        },
        {
          title: "Closed Cases",
          value: closedCases.toString(),
          change: "+0%",
          trend: "up" as const,
          icon: CheckCircle,
          color: "text-success"
        }
      ]);
    }
  }, [cases]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-warning';
      case 'in_progress': return 'bg-accent';
      case 'closed': return 'bg-success';
      case 'archived': return 'bg-muted';
      default: return 'bg-muted';
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
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'default' as const;
      case 'low': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const handleFiltersChange = (filters: any) => {
    let filtered = [...cases];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(case_ => 
        case_.title.toLowerCase().includes(searchTerm) ||
        case_.case_number.toLowerCase().includes(searchTerm) ||
        case_.subject_name?.toLowerCase().includes(searchTerm) ||
        case_.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(case_ => case_.status === filters.status);
    }

    if (filters.caseType) {
      filtered = filtered.filter(case_ => case_.case_type === filters.caseType);
    }

    if (filters.priority) {
      filtered = filtered.filter(case_ => case_.priority === filters.priority);
    }

    if (filters.assignedTo) {
      if (filters.assignedTo === 'assigned') {
        filtered = filtered.filter(case_ => case_.assigned_to);
      } else if (filters.assignedTo === 'unassigned') {
        filtered = filtered.filter(case_ => !case_.assigned_to);
      } else if (filters.assignedTo === 'my_cases') {
        filtered = filtered.filter(case_ => 
          case_.assigned_to === userProfile?.user_id || case_.created_by === userProfile?.user_id
        );
      }
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(case_ => 
        new Date(case_.created_at) >= filters.dateFrom
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(case_ => 
        new Date(case_.created_at) <= filters.dateTo
      );
    }

    setFilteredCases(filtered);
  };

  const handleNewCase = () => {
    // Navigate to case creation - this would typically use router
    console.log("Navigate to new case form");
  };

  const handleExport = () => {
    // Export filtered cases to CSV
    const csvContent = [
      ['Case Number', 'Title', 'Type', 'Status', 'Priority', 'Created Date'].join(','),
      ...filteredCases.map(case_ => [
        case_.case_number,
        `"${case_.title}"`,
        case_.case_type,
        case_.status,
        case_.priority || 'Medium',
        format(new Date(case_.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Show most recent cases from filtered results
  const recentCases = filteredCases.slice(0, 20);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.full_name}. Here's your case overview.
          </p>
        </div>
        {(userProfile?.role === 'admin' || userProfile?.role === 'investigator') && (
          <Button onClick={handleNewCase} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className={`h-4 w-4 mr-1 ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`} />
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">from last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="cases" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-6">
          {/* Case Filters */}
          <CaseFilters 
            onFiltersChange={handleFiltersChange}
            totalCount={filteredCases.length}
            loading={loading}
            onRefresh={fetchCases}
            onExport={handleExport}
          />

          {/* Cases Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                  Cases ({filteredCases.length})
                </CardTitle>
              </div>
            </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Case ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Assignee</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Last Update</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.length > 0 ? recentCases.map((case_) => (
                  <tr key={case_.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{case_.case_number}</code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{case_.title}</div>
                      {case_.subject_name && (
                        <div className="text-sm text-muted-foreground">{case_.subject_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{case_.case_type}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(case_.status)}`}></div>
                        <span className="text-sm font-medium">{getStatusLabel(case_.status)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getPriorityVariant(case_.priority)}>
                        {case_.priority || 'Medium'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {case_.assigned_to ? 'Assigned' : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(case_.updated_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(userProfile?.role === 'admin' || userProfile?.role === 'investigator' || case_.assigned_to === userProfile?.user_id) && (
                          <Button variant="ghost" size="sm" title="Edit Case">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No cases found</p>
                        <p className="text-sm">Cases will appear here once they are created.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CaseAnalytics cases={cases} />
        </TabsContent>
      </Tabs>
    </div>
  );
}