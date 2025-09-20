import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  Calendar,
  Target
} from "lucide-react";

interface CaseAnalyticsProps {
  cases: any[];
}

export const CaseAnalytics = ({ cases }: CaseAnalyticsProps) => {
  // Calculate statistics
  const totalCases = cases.length;
  const openCases = cases.filter(c => c.status === 'open').length;
  const inProgressCases = cases.filter(c => c.status === 'in_progress').length;
  const closedCases = cases.filter(c => c.status === 'closed').length;
  const highPriorityCases = cases.filter(c => c.priority === 'high').length;

  // Case type distribution
  const caseTypeData = cases.reduce((acc, case_) => {
    acc[case_.case_type] = (acc[case_.case_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const caseTypeChartData = Object.entries(caseTypeData).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Status distribution
  const statusData = [
    { name: 'Open', value: openCases, color: '#f59e0b' },
    { name: 'In Progress', value: inProgressCases, color: '#3b82f6' },
    { name: 'Closed', value: closedCases, color: '#10b981' },
  ];

  // Monthly case creation trend (last 6 months)
  const monthlyData = cases.reduce((acc, case_) => {
    const month = new Date(case_.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-6)
    .map(([month, count]) => ({ month, cases: count }));

  // Average resolution time (mock data for now)
  const avgResolutionTime = closedCases > 0 ? "7.2 days" : "N/A";
  
  // Performance metrics
  const caseResolutionRate = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;
  const urgentCaseRate = totalCases > 0 ? Math.round((highPriorityCases / totalCases) * 100) : 0;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseResolutionRate}%</div>
            <Progress value={caseResolutionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {closedCases} of {totalCases} cases closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionTime}</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              12% faster than last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Priority Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityCases}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Badge variant={urgentCaseRate > 30 ? "destructive" : "secondary"} className="text-xs">
                {urgentCaseRate}% of total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCases + inProgressCases}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {openCases} open, {inProgressCases} in progress
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Case Types</CardTitle>
          </CardHeader>
          <CardContent>
            {caseTypeChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caseTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Case Creation Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cases" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};