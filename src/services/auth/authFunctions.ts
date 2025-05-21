import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { signIn, signOut as amplifySignOut, getCurrentUser, fetchAuthSession, confirmSignIn } from 'aws-amplify/auth';

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
      options: {
        authFlowType: "USER_PASSWORD_AUTH"
      }
    });
    
    // Handle force change password challenge
    if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD') {
      // Show toast to inform user they need to change password
      toast({
        title: "Password Change Required",
        description: "Please set a new password for your account.",
      });
      
      // Prompt user for new password
      const newPassword = prompt("Please enter a new password (minimum 8 characters, must include uppercase, lowercase, numbers, and special characters):");
      
      if (!newPassword) {
        throw new Error("New password is required");
      }
      
      try {
        // Confirm sign in with new password
        const confirmResult = await confirmSignIn({
          challengeResponse: newPassword
        });
        
        if (!confirmResult.isSignedIn) {
          throw new Error("Failed to change password");
        }
        
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully."
        });
        
        return { success: true };
      } catch (confirmError) {
        console.error("Error confirming password change:", confirmError);
        throw new Error("Failed to set new password. Please ensure it meets all requirements.");
      }
    }
    
    if (signInResult.isSignedIn) {
      try {
        // Get the current session to access tokens and user info
        const session = await fetchAuthSession();
        const user = await getCurrentUser();
        
        // Extract groups from the ID token
        const groups = session.tokens?.idToken?.payload['cognito:groups'] || [];
        
        // Store user info for our app's usage
        const userInfo = {
          sub: user.userId,
          email: email,
          name: email,
          "cognito:groups": groups
        };
        
        localStorage.setItem("user_info", JSON.stringify(userInfo));
        
        toast({
          title: "Login Successful",
          description: "You've been successfully logged in."
        });
        
        return { success: true };
      } catch (err) {
        console.error("Error getting user details:", err);
        throw err;
      }
    }
    
    throw new Error("Login failed");
  } catch (error: any) {
    console.error('Error during login:', error);
    
    let errorMessage = "There was an error during login.";
    if (error.message) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Login Failed",
      description: errorMessage,
      variant: "destructive"
    });
    
    return { success: false };
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    // Sign out from Cognito
    await amplifySignOut();
    
    // Clear local storage items
    localStorage.removeItem('user_info');
    
    // Redirect to home page
    window.location.href = "/";
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};