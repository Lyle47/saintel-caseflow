import { Search, Bell, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* SAINTEL Branding */}
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-2 rounded-lg">
              <div className="text-2xl font-bold">S</div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">SAINTEL</h1>
              <p className="text-sm opacity-90">Case Management System</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search cases..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 border-white/20">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
            
            <div className="relative">
              <Bell className="h-5 w-5 cursor-pointer hover:text-white/80" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-warning text-warning-foreground text-xs">
                3
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/20">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Agent Smith</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}