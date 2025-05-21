
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authService, PendingUser, UserStatus } from "@/services/auth";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, RefreshCcw, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      console.log("Admin: Loading users...");
      const users = await authService.getPendingUsers();
      console.log("Admin: Users loaded:", users);
      setUsers(users);
      
      // Additional direct database check for debugging
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('status', 'PENDING');
      
      if (error) {
        console.error("Direct query error:", error);
      } else {
        console.log("Direct query results:", profiles);
        if (profiles?.length !== users.length) {
          console.warn("Discrepancy between service and direct query results");
        }
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      setLoadingError(error.message || "Failed to load user requests");
      toast({
        title: "Error",
        description: "Failed to load user requests. Please try refreshing.",
        variant: "destructive"
      });
    }
  };

  const refreshUsers = async () => {
    setIsRefreshing(true);
    setLoadingError(null);
    await loadUsers();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "User list has been refreshed."
    });
  };

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

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
          navigate("/login");
          return;
        }
        
        const adminStatus = await authService.isAdmin();
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive"
          });
          navigate("/dashboard");
          return;
        }
        
        await loadUsers();
      } catch (error: any) {
        console.error("Error checking authentication:", error);
        setLoadingError(error.message || "Authentication error");
        toast({
          title: "Error",
          description: "There was an error loading the admin dashboard.",
          variant: "destructive"
        });
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleApproveUser = async (userId: string) => {
    try {
      const result = await authService.approveUser(userId);
      if (result.success) {
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "Success",
          description: "User has been approved successfully."
        });
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user.",
        variant: "destructive"
      });
    }
  };
  
  const handleRejectUser = async (userId: string) => {
    try {
      const result = await authService.rejectUser(userId);
      if (result.success) {
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "Success",
          description: "User has been rejected successfully."
        });
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Error",
        description: "Failed to reject user.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null;
  }

  const pendingUsers = users.filter(user => user.status === UserStatus.PENDING);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error loading users: {loadingError}</p>
            <p className="text-sm mt-1">Try using the refresh button or reload the page.</p>
          </div>
        )}
        
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Requests
              {pendingUsers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>User Approval Requests</CardTitle>
                <CardDescription>
                  Review and manage new user registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <UserCheck className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">No Pending Requests</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All user requests have been processed
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                  onClick={() => handleApproveUser(user.id)}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectUser(user.id)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
