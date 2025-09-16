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
  MoreVertical
} from "lucide-react";

export function Dashboard() {
  const stats = [
    {
      title: "Total Cases",
      value: "127",
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Open Cases",
      value: "43",
      change: "+5",
      trend: "up",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "In Progress",
      value: "62",
      change: "-3",
      trend: "down",
      icon: AlertTriangle,
      color: "text-accent"
    },
    {
      title: "Closed Cases",
      value: "22",
      change: "+8",
      trend: "up",
      icon: CheckCircle,
      color: "text-success"
    }
  ];

  const recentCases = [
    {
      id: "SI-202412-001",
      title: "Missing Person - Sarah Johnson",
      type: "Missing Person",
      status: "Open",
      priority: "High",
      assignee: "Det. Williams",
      lastUpdate: "2 hours ago",
      statusColor: "bg-warning"
    },
    {
      id: "SI-202412-002", 
      title: "Theft Investigation - Downtown Store",
      type: "Theft",
      status: "In Progress",
      priority: "Medium",
      assignee: "Det. Brown",
      lastUpdate: "5 hours ago",
      statusColor: "bg-accent"
    },
    {
      id: "SI-202412-003",
      title: "Fraud Case - Insurance Claim",
      type: "Fraud",
      status: "Closed",
      priority: "Low",
      assignee: "Det. Davis",
      lastUpdate: "1 day ago",
      statusColor: "bg-success"
    },
    {
      id: "SI-202411-087",
      title: "Missing Person - John Martinez",
      type: "Missing Person", 
      status: "In Progress",
      priority: "High",
      assignee: "Det. Wilson",
      lastUpdate: "3 days ago",
      statusColor: "bg-accent"
    }
  ];

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
                {recentCases.map((case_) => (
                  <tr key={case_.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{case_.id}</code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{case_.title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{case_.type}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${case_.statusColor}`}></div>
                        <span className="text-sm font-medium">{case_.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={case_.priority === 'High' ? 'destructive' : case_.priority === 'Medium' ? 'default' : 'secondary'}
                      >
                        {case_.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">{case_.assignee}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{case_.lastUpdate}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}