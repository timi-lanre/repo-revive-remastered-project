import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authService, UserStatus } from "@/services/auth";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, LogOut, LayoutDashboard, Key, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import CreateUserForm from "@/components/admin/CreateUserForm";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  createdAt: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("create");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      refreshUsers();
    }
  };

  const loadUsers = async () => {
    try {
      console.log("Loading user profiles...");
      
      // Get all user profiles - use a more direct query
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profileError) {
        console.error("Error loading profiles:", profileError);
        // Check if it's a permission error (most common with RLS)
        if (profileError.code === '42501' || profileError.message.includes('permission denied')) {
          console.log("Permission denied error detected. Checking admin status...");
          const adminCheck = await authService.isAdmin();
          console.log("Current user admin status:", adminCheck);
          
          if (!adminCheck) {
            throw new Error("Your admin session has expired. Please log in again.");
          }
        }
        throw profileError;
      }

      if (!profiles) {
        console.log("No profiles found in the database");
        setAllUsers([]);
        return;
      }

      console.log(`Found ${profiles.length} user profiles`);
      
      const formattedUsers = profiles.map(profile => ({
        id: profile.user_id,
        email: profile.email || 'No email',
        firstName: profile.first_name || 'Unknown',
        lastName: profile.last_name || 'Unknown',
        status: profile.status || 'UNKNOWN',
        role: profile.role || 'user',
        createdAt: profile.created_at || new Date().toISOString()
      }));

      setAllUsers(formattedUsers);
      setLoadingError(null);
      console.log("Users loaded successfully:", formattedUsers.length);
      
    } catch (error: any) {
      console.error("Error loading users:", error);
      setLoadingError(error.message || "Failed to load users");
      
      // Special handling for session expiration
      if (error.message.includes('expired') || error.message.includes('log in again')) {
        toast({
          title: "Session Expired",
          description: "Your admin session has expired. Please log in again.",
          variant: "destructive"
        });
        // Force logout and redirect to login
        await authService.signOut();
        navigate("/login");
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to load users. Please try refreshing.",
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

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      await authService.resetPassword(userId);
      toast({
        title: "Success",
        description: `Password reset email sent to ${email}. Please check your inbox.`,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive"
      });
    }
  };

  const createProfileForUser = async (userId: string, email: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            status: "APPROVED",
            role: "user"
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile created for user.",
      });

      await loadUsers();
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile for user.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        console.log("Checking authentication status...");
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
          console.log("User not authenticated, redirecting to login");
          navigate("/login");
          return;
        }
        
        console.log("User is authenticated, checking admin status...");
        const adminStatus = await authService.isAdmin();
        console.log("Admin status:", adminStatus);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          console.log("User is not an admin, redirecting to dashboard");
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive"
          });
          navigate("/dashboard");
          return;
        }
        
        console.log("User is admin, loading users...");
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
    
    // Event listener for user creation
    const handleUserCreated = () => {
      console.log("User created event detected, refreshing list");
      refreshUsers();
    };
    
    window.addEventListener('userCreated', handleUserCreated);
    
    // Also set up a periodic refresh for the admin page
    const refreshInterval = setInterval(() => {
      if (activeTab === "all" && !isRefreshing) {
        console.log("Auto-refreshing user list");
        loadUsers().catch(error => {
          console.error("Error in auto-refresh:", error);
        });
      }
    }, 60000); // Refresh every minute
    
    return () => {
      window.removeEventListener('userCreated', handleUserCreated);
      clearInterval(refreshInterval);
    };
  }, [navigate, activeTab, isRefreshing]);

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

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error loading users: {loadingError}</p>
            <p className="text-sm mt-1">
              {loadingError.includes('expired') ? 
                'Your session has expired. Please try logging in again.' :
                'Try using the refresh button or reload the page.'
              }
            </p>
          </div>
        )}
        
        <Tabs defaultValue="create" className="space-y-4" value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="create">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </TabsTrigger>
            <TabsTrigger value="all">
              All Users
              <Badge variant="secondary" className="ml-2">
                {allUsers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <CreateUserForm />
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({allUsers.length})</CardTitle>
                <CardDescription>
                  Manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.length > 0 ? (
                        allUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={
                                user.status === 'APPROVED' ? 'default' : 
                                user.status === 'NO_PROFILE' ? 'destructive' : 
                                'secondary'
                              }>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {user.status === 'NO_PROFILE' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => createProfileForUser(user.id, user.email, user.firstName, user.lastName)}
                                  >
                                    Create Profile
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResetPassword(user.id, user.email)}
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Reset Password
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No users found. Create a new user or refresh the list.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
