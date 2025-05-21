
import { Issuer } from 'openid-client';
import { cognitoConfig } from '@/config/cognito';

// We'll store the OpenID client here
let oidcClient: any = null;

// Initialize the OpenID client
export async function initializeOidcClient(): Promise<any> {
  try {
    const issuer = await Issuer.discover(`https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`);
    
    // Create client with correct props
    oidcClient = new issuer.Client({
      client_id: cognitoConfig.userPoolWebClientId,
      redirect_uris: [window.location.origin + '/callback'],
      response_types: ['code'],
    });
    
    console.log('OIDC client initialized successfully');
    return oidcClient;
  } catch (error) {
    console.error('Failed to initialize OIDC client:', error);
    throw error; // Propagate error for better debugging
  }
}

// Get or initialize OIDC client
export async function getOidcClient(): Promise<any> {
  if (!oidcClient) {
    await initializeOidcClient();
  }
  return oidcClient;
}

// Generate nonce and state for authentication
export function generateAuthParams() {
  const { generators } = require('openid-client');
  const state = generators.state();
  const nonce = generators.nonce();
  
  return { state, nonce };
}
