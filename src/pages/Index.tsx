import { useState } from "react";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { CaseForm } from "@/components/CaseForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "cases", label: "All Cases", icon: FileText },
    { id: "create", label: "New Case", icon: Plus },
    { id: "search", label: "Search", icon: Search },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return <CaseForm />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-88px)]">
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
                <div className="flex justify-between">
                  <span>Open Cases</span>
                  <Badge variant="outline">43</Badge>
                </div>
                <div className="flex justify-between">
                  <span>This Month</span>
                  <Badge variant="outline">12</Badge>
                </div>
                <div className="flex justify-between">
                  <span>High Priority</span>
                  <Badge variant="destructive">7</Badge>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
