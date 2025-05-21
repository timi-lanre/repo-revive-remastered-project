
import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { getOidcClient, generateAuthParams } from './oidcClient';

// Begin the login flow - redirects to Cognito's login page
export const initiateLogin = async (): Promise<void> => {
  try {
    const oidcClient = await getOidcClient();
    
    // Generate state and nonce for security
    const { state, nonce } = generateAuthParams();
    
    // Store in sessionStorage for validation during callback
    sessionStorage.setItem('auth_state', state);
    sessionStorage.setItem('auth_nonce', nonce);
    
    // Get authorization URL and redirect
    const authUrl = oidcClient.authorizationUrl({
      scope: 'email openid profile',
      state,
      nonce,
    });
    
    // Redirect to Cognito's login page
    window.location.href = authUrl;
  } catch (error: any) {
    console.error('Error starting login flow:', error);
    toast({
      title: "Login Failed",
      description: error.message || "There was an error starting the login process.",
      variant: "destructive"
    });
    throw error;
  }
};

// Handle the callback from Cognito after login
export const handleCallback = async (callbackUrl: string) => {
  try {
    const oidcClient = await getOidcClient();
    
    // Get the stored state and nonce
    const state = sessionStorage.getItem('auth_state');
    const nonce = sessionStorage.getItem('auth_nonce');
    
    if (!state || !nonce) {
      throw new Error('Missing authentication state');
    }
    
    // Parse the callback parameters
    const params = oidcClient.callbackParams(callbackUrl);
    
    // Exchange the code for tokens
    const tokenSet = await oidcClient.callback(
      window.location.origin + '/callback',
      params,
      { state, nonce }
    );
    
    // Get user info from the access token
    const userInfo = await oidcClient.userinfo(tokenSet.access_token!);
    
    // Store tokens and user info in localStorage
    localStorage.setItem('id_token', tokenSet.id_token!);
    localStorage.setItem('access_token', tokenSet.access_token!);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    
    // Clean up state and nonce
    sessionStorage.removeItem('auth_state');
    sessionStorage.removeItem('auth_nonce');
    
    return { userInfo, tokenSet };
  } catch (error: any) {
    console.error('Error handling authentication callback:', error);
    toast({
      title: "Authentication Failed",
      description: error.message || "There was an error completing the login process.",
      variant: "destructive"
    });
    throw error;
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    const oidcClient = await getOidcClient();
    
    // Clear tokens and user info
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    
    // Construct logout URL
    const cognitoRegion = cognitoConfig.userPoolId.split('_')[0];
    const logoutUrl = `https://${cognitoRegion}.auth.${cognitoConfig.region}.amazoncognito.com/logout?client_id=${cognitoConfig.userPoolWebClientId}&logout_uri=${encodeURIComponent(window.location.origin)}`;
    
    // Redirect to logout URL
    window.location.href = logoutUrl;
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};
