
import { Client } from 'openid-client';
import { Issuer } from 'openid-client';
import { generators } from 'openid-client';
import { cognitoConfig } from "@/config/cognito";

// Initialize OIDC client
let client: Client | null = null;

export const initializeOidcClient = async () => {
  if (client) return client;

  try {
    // Discover the OIDC provider
    const cognitoIssuer = await Issuer.discover(
      `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/openid-configuration`
    );

    // Create an OIDC client
    client = new cognitoIssuer.Client({
      client_id: cognitoConfig.clientId,
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
  const nonce = generators.nonce();
  const state = generators.state();
  
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
