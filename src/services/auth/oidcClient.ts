
import { cognitoConfig } from '@/config/cognito';
import * as oidcClient from 'openid-client';

// We'll store the OpenID client here
let client: any = null;

// Initialize the OpenID client
export async function initializeOidcClient(): Promise<any> {
  try {
    const issuer = await oidcClient.Issuer.discover(`https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`);
    
    // Create client with correct props
    client = new issuer.Client({
      client_id: cognitoConfig.userPoolWebClientId,
      redirect_uris: [window.location.origin + '/callback'],
      response_types: ['code'],
    });
    
    console.log('OIDC client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize OIDC client:', error);
    throw error; // Propagate error for better debugging
  }
}

// Get or initialize OIDC client
export async function getOidcClient(): Promise<any> {
  if (!client) {
    await initializeOidcClient();
  }
  return client;
}

// Generate nonce and state for authentication
export function generateAuthParams() {
  const { generators } = oidcClient;
  const state = generators.state();
  const nonce = generators.nonce();
  
  return { state, nonce };
}
