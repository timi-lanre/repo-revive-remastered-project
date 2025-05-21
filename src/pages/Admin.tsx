
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authService, PendingUser } from "@/services/auth";
import { toast } from "@/components/ui/use-toast";
import { UserCheck, UserX } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
          navigate("/login");
          return;
        }
        
        // Check if the user is in the Admin group
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
        
        // Load pending users using the Cognito API
        const users = await authService.getPendingUsers();
        setPendingUsers(users);
      } catch (error) {
        console.error("Error checking authentication:", error);
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
    const result = await authService.approveUser(userId);
    if (result.success) {
      // Update local state to remove approved user
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    }
  };
  
  const handleRejectUser = async (userId: string) => {
    const result = await authService.rejectUser(userId);
    if (result.success) {
      // Update local state to remove rejected user
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // Will redirect to dashboard from useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Card className="shadow-lg border-gray-100">
          <CardHeader>
            <CardTitle>User Approval Requests</CardTitle>
            <CardDescription>
              Review and approve new user sign-up requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending approval requests</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
