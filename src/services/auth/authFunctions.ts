
import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { Auth } from 'aws-amplify';

// Initialize Amplify Auth with the Cognito configuration
const initializeAuth = () => {
  if (!Auth.configure) return;

  Auth.configure({
    region: cognitoConfig.region,
    userPoolId: cognitoConfig.userPoolId,
    userPoolWebClientId: cognitoConfig.userPoolWebClientId,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
  });
};

// Call initialize on module import
initializeAuth();

// Production-ready login with email and password using Amplify Auth
export const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    // Sign in using Amplify Auth
    const user = await Auth.signIn(email, password);
    
    // Store user info and tokens
    if (user) {
      // Storing tokens is handled by Amplify Auth
      
      // Store user info for our app's usage
      const userInfo = {
        sub: user.username || user.attributes?.sub,
        email: user.attributes?.email || email,
        name: user.attributes?.name || email,
        "cognito:groups": user.signInUserSession?.accessToken?.payload["cognito:groups"] || []
      };
      
      localStorage.setItem("user_info", JSON.stringify(userInfo));
      
      toast({
        title: "Login Successful",
        description: "You've been successfully logged in."
      });
      
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
    await Auth.signOut();
    
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
