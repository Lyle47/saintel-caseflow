import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { CaseForm } from "@/components/CaseForm";
import { CaseDetailsView } from "@/components/CaseDetailsView";
import { UserManagement } from "@/components/UserManagement";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home, 
  FileText, 
  Plus, 
  Search, 
  Archive, 
  Settings,
  Users
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const { userProfile } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();

  // Filter menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "cases", label: "All Cases", icon: FileText },
    ];

    // Add creation capability for investigators and admins
    if (userProfile?.role === 'investigator' || userProfile?.role === 'admin') {
      baseItems.push({ id: "create", label: "New Case", icon: Plus });
    }

    baseItems.push(
      { id: "search", label: "Search", icon: Search },
      { id: "archive", label: "Archive", icon: Archive }
    );

    // Only admins can access user management
    if (userProfile?.role === 'admin') {
      baseItems.push({ id: "users", label: "Users", icon: Users });
    }

    baseItems.push({ id: "settings", label: "Settings", icon: Settings });

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleViewCase = (caseData: any) => {
    setSelectedCase(caseData);
    setActiveTab("caseDetails");
  };

  const handleCreateCase = () => {
    setActiveTab("create");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return <CaseForm onBack={() => setActiveTab("dashboard")} />;
      case "users":
        return <UserManagement />;
      case "caseDetails":
        return selectedCase ? (
          <CaseDetailsView 
            caseId={selectedCase.id} 
            onBack={() => setActiveTab("dashboard")} 
          />
        ) : (
          <Dashboard onCreateCase={handleCreateCase} onViewCase={handleViewCase} />
        );
      case "dashboard":
      default:
        return <Dashboard onCreateCase={handleCreateCase} onViewCase={handleViewCase} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-64 bg-card border-r border-border min-h-[calc(100vh-88px)]">
          <div className="p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
            
            {/* Quick Stats in Sidebar */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm mb-3">Quick Overview</h3>
              <div className="space-y-2 text-sm">
                {statsLoading ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Open Cases</span>
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>This Month</span>
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>High Priority</span>
                      <Skeleton className="h-5 w-8" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Open Cases</span>
                      <Badge variant="outline">{stats.openCases}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month</span>
                      <Badge variant="outline">{stats.monthlyNewCases}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>High Priority</span>
                      <Badge variant="destructive">{stats.highPriorityCases}</Badge>
                    </div>
                    {userProfile?.role === 'volunteer' && (
                      <div className="flex justify-between">
                        <span>Assigned to Me</span>
                        <Badge variant="secondary">{stats.assignedCases}</Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed top-16 left-4 z-50">
          <MobileNavigation
            menuItems={menuItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={stats}
            statsLoading={statsLoading}
            userProfile={userProfile}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
