import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { signOut as amplifySignOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Initialize Amplify Auth with the Cognito configuration
const initializeAuth = () => {
  // Configuration now happens in main.tsx or App.tsx
  // No need to call configure here anymore in Amplify v6+
};

// Call initialize on module import
initializeAuth();

// Get the Cognito Hosted UI sign-in URL
const getCognitoSignInUrl = () => {
  const queryParams = new URLSearchParams({
    client_id: cognitoConfig.userPoolWebClientId,
    response_type: 'code',
    scope: 'email openid profile',
    redirect_uri: cognitoConfig.redirectUri
  });

  return `https://${cognitoConfig.oauth.domain}/login?${queryParams.toString()}`;
};

// Production-ready login with email and password using Cognito Hosted UI
export const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    if (!cognitoConfig.oauth.domain) {
      throw new Error('Cognito OAuth domain is not configured');
    }
    
    // Redirect to Cognito Hosted UI
    window.location.href = getCognitoSignInUrl();
    return { success: true };
  } catch (error: any) {
    console.error('Error during login:', error);
    
    toast({
      title: "Login Failed",
      description: "There was an error during login. Please try again.",
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