import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu } from 'lucide-react';

interface MobileNavigationProps {
  menuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: {
    openCases: number;
    monthlyNewCases: number;
    highPriorityCases: number;
    assignedCases: number;
  };
  statsLoading: boolean;
  userProfile?: {
    role: string;
  };
}

export const MobileNavigation = ({
  menuItems,
  activeTab,
  onTabChange,
  stats,
  statsLoading,
  userProfile
}: MobileNavigationProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Navigation Items */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
          
          {/* Quick Stats */}
          <div className="p-4 bg-muted/50 rounded-lg">
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
      </SheetContent>
    </Sheet>
  );
};