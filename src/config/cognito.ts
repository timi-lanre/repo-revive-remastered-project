// AWS Cognito configuration for production authentication
export const cognitoConfig = {
  // AWS Cognito credentials - these should match your actual user pool
  region: "ca-central-1",
  userPoolId: "ca-central-1_ZKlPFHXEq",
  userPoolWebClientId: "6qro1qfosbsjhgdj2oef9l7nj7",
  
  // Token signing key URL
  jwksUri: "https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_ZKlPFHXEq/.well-known/jwks.json",
  
  // API endpoint for custom Cognito operations
  apiUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth`,
  
  // Auth configuration
  authenticationFlowType: "USER_PASSWORD_AUTH",
  enableRefreshTokens: true,
};