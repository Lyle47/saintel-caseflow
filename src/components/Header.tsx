import { Search, Bell, User, Plus, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function Header() {
  const { userProfile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleNewCase = () => {
    // Navigate to case creation form
    console.log("Navigate to new case form");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search for:", searchQuery);
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'investigator': return 'Investigator';
      case 'volunteer': return 'Volunteer';
      case 'readonly': return 'Read Only';
      default: return 'User';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive';
      case 'investigator': return 'bg-primary';
      case 'volunteer': return 'bg-accent';
      case 'readonly': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* SageIntel Branding */}
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <div className="text-2xl font-bold">S</div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">SageIntel</h1>
              <p className="text-sm opacity-90">Case Management System</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, subjects, or case numbers..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {(userProfile?.role === 'admin' || userProfile?.role === 'investigator') && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 border-white/20"
                onClick={handleNewCase}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            )}
            
            <div className="relative cursor-pointer hover:opacity-80">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-warning text-warning-foreground text-xs">
                0
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <User className="h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{userProfile?.full_name || 'User'}</span>
                    <span className="text-xs opacity-75">{getRoleDisplay(userProfile?.role)}</span>
                  </div>
                  <Badge className={`${getRoleBadgeColor(userProfile?.role)} text-xs px-1 py-0`}>
                    {userProfile?.role?.toUpperCase()}
                  </Badge>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userProfile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}