
import { Issuer } from 'openid-client';
import { cognitoConfig } from '@/config/cognito';

// We'll store the OpenID client here
let oidcClient: any = null;

// Initialize the OpenID client
export async function initializeOidcClient(): Promise<any> {
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

// Get or initialize OIDC client
export async function getOidcClient(): Promise<any> {
  if (!oidcClient) {
    await initializeOidcClient();
    if (!oidcClient) {
      throw new Error('Failed to initialize OIDC client');
    }
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
