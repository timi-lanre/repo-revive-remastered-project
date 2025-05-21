import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { Issuer, generators, Client } from 'openid-client';

// User status enum
export enum UserStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

// We'll store the OpenID client here
let oidcClient: Client | null = null;

// Initialize the OpenID client
async function initializeOidcClient() {
  try {
    const issuer = await Issuer.discover(`https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`);
    
    // Create client
    oidcClient = new issuer.Client({
      client_id: cognitoConfig.userPoolWebClientId,
      client_secret: cognitoConfig.clientSecret,
      redirect_uris: [window.location.origin + '/callback'],
      response_types: ['code'],
    });
    
    console.log('OIDC client initialized successfully');
    return oidcClient;
  } catch (error) {
    console.error('Failed to initialize OIDC client:', error);
    return null;
  }
}

// Make sure we initialize the client when this module is loaded
initializeOidcClient().catch(console.error);

export const authService = {
  // Begin the login flow - redirects to Cognito's login page
  initiateLogin: async () => {
    try {
      if (!oidcClient) {
        await initializeOidcClient();
        if (!oidcClient) throw new Error('Failed to initialize OIDC client');
      }
      
      // Generate state and nonce for security
      const state = generators.state();
      const nonce = generators.nonce();
      
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
  },

  // Handle the callback from Cognito after login
  handleCallback: async (callbackUrl: string) => {
    try {
      if (!oidcClient) {
        await initializeOidcClient();
        if (!oidcClient) throw new Error('Failed to initialize OIDC client');
      }
      
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
  },

  // Sign out function
  signOut: async () => {
    try {
      if (!oidcClient) {
        await initializeOidcClient();
        if (!oidcClient) throw new Error('Failed to initialize OIDC client');
      }
      
      // Clear tokens and user info
      localStorage.removeItem('id_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      
      // Construct logout URL
      const logoutUrl = `https://${cognitoConfig.userPoolId.split('_')[0]}.auth.${cognitoConfig.region}.amazoncognito.com/logout?client_id=${cognitoConfig.userPoolWebClientId}&logout_uri=${encodeURIComponent(window.location.origin)}`;
      
      // Redirect to logout URL
      window.location.href = logoutUrl;
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (!userInfoStr) return null;
      
      return JSON.parse(userInfoStr);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      return !!accessToken;
    } catch {
      return false;
    }
  },
  
  // Check if user is an admin by verifying their group membership
  isAdmin: async () => {
    try {
      const idToken = localStorage.getItem('id_token');
      if (!idToken) return false;
      
      // Parse the ID token (without verification, as we trust our local storage)
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      // Extract the "cognito:groups" claim
      const groups = payload["cognito:groups"];
      
      // Check if the user is in the Admin group
      return Array.isArray(groups) && groups.includes("Admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },
  
  // These functions will remain stubs for now
  getPendingUsers: async () => {
    // ... keep existing code (getPendingUsers implementation)
  },
  
  approveUser: async (userId: string) => {
    // ... keep existing code (approveUser implementation)
  },
  
  rejectUser: async (userId: string) => {
    // ... keep existing code (rejectUser implementation)
  }
};
