
import { toast } from '@/components/ui/use-toast';

// Simplified login with email and password
export const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    // This is a simplified mock implementation for admin login
    // In a real app, this would validate against a database
    
    // You can modify these hardcoded credentials to match your actual admin details
    if ((email === "admin@example.com" && password === "adminpassword") || 
        (email === "admin" && password === "admin123")) {
      
      // Set up the admin user info
      const adminUserInfo = {
        sub: "admin-user-id",
        email: email,
        name: email === "admin@example.com" ? "Registered Admin" : "Admin User",
        "cognito:groups": ["Admin"]
      };
      
      localStorage.setItem("id_token", "admin-id-token");
      localStorage.setItem("access_token", "admin-access-token");
      localStorage.setItem("user_info", JSON.stringify(adminUserInfo));
      
      toast({
        title: "Login Successful",
        description: "You've been logged in as an admin."
      });
      
      return { success: true };
    }
    
    toast({
      title: "Login Failed",
      description: "Invalid email or password.",
      variant: "destructive"
    });
    
    return { success: false };
  } catch (error: any) {
    console.error('Error during login:', error);
    toast({
      title: "Login Failed",
      description: error.message || "There was an error during login.",
      variant: "destructive"
    });
    throw error;
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    // Clear tokens and user info
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    
    // Redirect to home page
    window.location.href = "/";
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};
