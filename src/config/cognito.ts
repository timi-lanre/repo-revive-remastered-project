
// AWS Cognito configuration for production authentication
export const cognitoConfig = {
  // AWS Cognito credentials - these should match your actual user pool
  region: "ca-central-1",
  userPoolId: "ca-central-1_ZKlPFHXEq",
  userPoolWebClientId: "6qro1qfosbsjhgdj2oef9l7nj7",
  clientSecret: "vgafb5qbl7j0nlks0p0jdvhrbudbhl3g7femdovea090rrle0po",
  
  // Add additional configuration as needed for your specific user pool
  oAuthDomain: "", // Your Cognito domain, e.g., "your-app-name.auth.ca-central-1.amazoncognito.com"
  redirectUri: window.location.origin + "/callback",
  responseType: "code", // Use authorization code grant flow for better security
};

// Function to get Cognito OAuth URL for sign-in
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
