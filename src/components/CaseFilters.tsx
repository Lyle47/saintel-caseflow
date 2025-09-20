import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Calendar as CalendarIcon, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface CaseFiltersProps {
  onFiltersChange: (filters: any) => void;
  totalCount: number;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const CaseFilters = ({ 
  onFiltersChange, 
  totalCount, 
  loading = false,
  onRefresh,
  onExport
}: CaseFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [caseType, setCaseType] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [assignedTo, setAssignedTo] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyFilters = () => {
    const filters = {
      search: searchTerm.trim(),
      status: status === "all" ? undefined : status,
      caseType: caseType === "all" ? undefined : caseType,
      priority: priority === "all" ? undefined : priority,
      assignedTo: assignedTo === "all" ? undefined : assignedTo,
      dateFrom,
      dateTo,
    };
    onFiltersChange(filters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatus("all");
    setCaseType("all");
    setPriority("all");
    setAssignedTo("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange({});
  };

  const hasActiveFilters = searchTerm || status !== "all" || caseType !== "all" || 
    priority !== "all" || assignedTo !== "all" || dateFrom || dateTo;

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search and Quick Actions */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases, subjects, or case numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
            
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}

            {onExport && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Case Type</label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Missing Person">Missing Person</SelectItem>
                  <SelectItem value="Theft">Theft</SelectItem>
                  <SelectItem value="Fraud">Fraud</SelectItem>
                  <SelectItem value="Cyber Crime">Cyber Crime</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Assignment</label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="my_cases">My Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-muted-foreground">to</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateTo ? format(dateTo, "MMM dd") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} size="sm">
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <div className="flex flex-wrap gap-1">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {status !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Status: {status}
                  <button onClick={() => setStatus("all")} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {caseType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Type: {caseType}
                  <button onClick={() => setCaseType("all")} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {priority !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Priority: {priority}
                  <button onClick={() => setPriority("all")} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground ml-auto">
              {totalCount} cases found
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};