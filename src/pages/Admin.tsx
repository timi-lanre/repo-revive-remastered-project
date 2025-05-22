
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import AdminLoading from "@/components/admin/AdminLoading";

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
      
      // DIRECT SQL APPROACH FOR DEBUGGING - this bypasses RLS entirely for admins
      const { data: rawProfiles, error: sqlError } = await supabase.rpc('get_all_profiles_for_admin');
      
      if (sqlError) {
        console.error("SQL function error:", sqlError);
        console.log("Falling back to standard query...");
        
        // Standard approach as fallback
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
        
        console.log(`Found ${profiles.length} user profiles through standard query`);
        processProfiles(profiles);
      } else {
        // Process profiles from the SQL function
        if (!rawProfiles || rawProfiles.length === 0) {
          console.log("No profiles found in the database (SQL function)");
          setAllUsers([]);
          return;
        }
        
        console.log(`Found ${rawProfiles.length} user profiles through SQL function`);
        processProfiles(rawProfiles);
      }
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

  // Helper function to process profiles
  const processProfiles = (profiles: any[]) => {
    const formattedUsers = profiles.map(profile => ({
      id: profile.user_id,
      email: profile.email || 'No email',
      firstName: profile.first_name || 'Unknown',
      lastName: profile.last_name || 'Unknown',
      status: profile.status || 'UNKNOWN',
      role: profile.role || 'user',
      createdAt: profile.created_at || new Date().toISOString()
    }));

    // Log each user for debugging
    formattedUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, user.firstName, user.lastName, user.email, user.role);
    });

    setAllUsers(formattedUsers);
    setLoadingError(null);
    console.log("Users loaded successfully:", formattedUsers.length);
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
    }, 15000); // Refresh every 15 seconds for debugging
    
    return () => {
      window.removeEventListener('userCreated', handleUserCreated);
      clearInterval(refreshInterval);
    };
  }, [navigate, activeTab, isRefreshing]);

  if (isLoading) {
    return <AdminLoading />;
  }
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader refreshUsers={refreshUsers} isRefreshing={isRefreshing} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleTabChange={handleTabChange}
          allUsers={allUsers}
          loadingError={loadingError}
          handleResetPassword={handleResetPassword}
          createProfileForUser={createProfileForUser}
        />
      </main>
    </div>
  );
};

export default Admin;
