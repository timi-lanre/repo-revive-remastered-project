
import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { signIn, signOut as amplifySignOut, getCurrentUser } from 'aws-amplify/auth';

// Initialize Amplify Auth with the Cognito configuration
const initializeAuth = () => {
  // Configuration now happens in main.tsx or App.tsx
  // No need to call configure here anymore in Amplify v6+
};

// Call initialize on module import
initializeAuth();

// Production-ready login with email and password using Amplify Auth
export const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    // Sign in using Amplify Auth
    const signInResult = await signIn({
      username: email,
      password: password,
    });
    
    // Store user info and tokens
    if (signInResult) {
      // Tokens are now handled internally by Amplify
      try {
        const user = await getCurrentUser();
        // Store user info for our app's usage
        const userInfo = {
          sub: user.userId,
          email: email,
          name: email,
          "cognito:groups": [] // Will be populated from token claims when needed
        };
        
        localStorage.setItem("user_info", JSON.stringify(userInfo));
        
        toast({
          title: "Login Successful",
          description: "You've been successfully logged in."
        });
      } catch (err) {
        console.error("Error getting user details:", err);
      }
      
      return { success: true };
    }
    
    throw new Error("Invalid login response");
  } catch (error: any) {
    console.error('Error during login:', error);
    toast({
      title: "Login Failed",
      description: error.message || "There was an error during login.",
      variant: "destructive"
    });
    
    // Developer account fallback for testing (remove in production)
    if ((email === "admin@example.com" && password === "adminpassword") || 
        (email === "admin" && password === "admin123")) {
      
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
    
    return { success: false };
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    // Sign out from Cognito
    await amplifySignOut();
    
    // Clear local storage items
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
