
// AWS Cognito configuration
export const cognitoConfig = {
  // AWS Cognito credentials
  region: "ca-central-1",
  userPoolId: "ca-central-1_ZKlPFHXEq",
  userPoolWebClientId: "6qro1qfosbsjhgdj2oef9l7nj7",
  clientSecret: "vgafb5qbl7j0nlks0p0jdvhrbudbhl3g7femdovea090rrle0po",
};

// Function to initialize Cognito configuration
export const initializeCognito = () => {
  // This function is no longer needed as we initialize in the authService
  console.log("Cognito configuration initialized");
};
