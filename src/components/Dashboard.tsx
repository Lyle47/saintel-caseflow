import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Activity
} from "lucide-react";
import { useCases } from "@/hooks/useCases";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export function Dashboard() {
  const { cases, loading } = useCases();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState([
    { title: "Total Cases", value: "0", change: "0%", trend: "up", icon: FileText, color: "text-primary" },
    { title: "Open Cases", value: "0", change: "0%", trend: "up", icon: Clock, color: "text-warning" },
    { title: "In Progress", value: "0", change: "0%", trend: "up", icon: AlertTriangle, color: "text-accent" },
    { title: "Closed Cases", value: "0", change: "0%", trend: "up", icon: CheckCircle, color: "text-success" }
  ]);

  useEffect(() => {
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

  // Show most recent 10 cases
  const recentCases = cases.slice(0, 10);

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

      {/* Recent Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Cases</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
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
    </div>
  );
}