
// Import the openid-client package correctly
import { cognitoConfig } from "@/config/cognito";

// Initialize OIDC client
let client: any = null;

export const initializeOidcClient = async () => {
  if (client) return client;

  try {
    // Using dynamic import for the entire module since TypeScript has issues with the exports
    const openidClient = await import('openid-client');
    
    // Discover the OIDC provider
    const cognitoIssuer = await openidClient.Issuer.discover(
      `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/openid-configuration`
    );

    // Create an OIDC client
    client = new cognitoIssuer.Client({
      client_id: cognitoConfig.userPoolWebClientId, // Using the correct property name from cognitoConfig
      redirect_uris: [window.location.origin + '/auth/callback'],
      response_types: ['code'],
    });

    return client;
  } catch (error) {
    console.error('Error initializing OIDC client:', error);
    throw error;
  }
};

export const getAuthorizationUrl = async () => {
  const oidcClient = await initializeOidcClient();
  // Using crypto API instead of generators for nonce and state
  const nonce = Math.random().toString(36).substring(2, 15);
  const state = Math.random().toString(36).substring(2, 15);
  
  const url = oidcClient.authorizationUrl({
    scope: 'openid email profile',
    nonce,
    state,
  });

  // Store state for verification later
  sessionStorage.setItem('auth_state', state);
  
  return url;
};

export const handleCallback = async (callbackUrl: string) => {
  const oidcClient = await initializeOidcClient();
  const params = oidcClient.callbackParams(callbackUrl);
  
  const storedState = sessionStorage.getItem('auth_state');
  
  const tokenSet = await oidcClient.callback(
    window.location.origin + '/auth/callback',
    params,
    { state: storedState || undefined }
  );
  
  sessionStorage.removeItem('auth_state');
  
  return tokenSet;
};
