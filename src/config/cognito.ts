// AWS Cognito configuration for production authentication
export const cognitoConfig = {
  // AWS Cognito credentials - these should match your actual user pool
  region: "ca-central-1",
  userPoolId: "ca-central-1_ZKlPFHXEq",
  userPoolWebClientId: "6qro1qfosbsjhgdj2oef9l7nj7",
  
  // API endpoint for custom Cognito operations
  apiUrl: "https://your-api-endpoint.com/api",
  
  // Additional configuration for hosted UI (if needed)
  oAuthDomain: "", // Your Cognito domain if using hosted UI
  redirectUri: window.location.origin + "/callback",
  responseType: "code", // Use authorization code grant flow for better security
};

// Function to get Cognito OAuth URL for sign-in (if using hosted UI)
export const getCognitoSignInUrl = () => {
  const { userPoolWebClientId, oAuthDomain, redirectUri, responseType } = cognitoConfig;
  
  if (!oAuthDomain) {
    return null; // Direct signin is used instead of hosted UI
  }
  
  const params = new URLSearchParams({
    client_id: userPoolWebClientId,
    response_type: responseType,
    scope: 'email openid profile',
    redirect_uri: redirectUri,
  });
  
  return `https://${oAuthDomain}/login?${params.toString()}`;
};