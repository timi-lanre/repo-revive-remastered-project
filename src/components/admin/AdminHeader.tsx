
import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { toast } from "@/components/ui/use-toast";

interface AdminHeaderProps {
  refreshUsers: () => Promise<void>;
  isRefreshing: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ refreshUsers, isRefreshing }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="text-gray-600 hover:text-gray-900"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
            <Button 
              onClick={refreshUsers} 
              variant="outline"
              disabled={isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
