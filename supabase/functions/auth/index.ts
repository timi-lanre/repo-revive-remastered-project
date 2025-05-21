import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, ListUsersCommand, AdminUpdateUserAttributesCommand, AdminAddUserToGroupCommand, AdminDeleteUserCommand } from "npm:@aws-sdk/client-cognito-identity-provider";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const cognitoClient = new CognitoIdentityProviderClient({
  region: Deno.env.get("COGNITO_REGION"),
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
  },
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/auth", "");

    // Sign up endpoint
    if (path === "/signup" && req.method === "POST") {
      const { email, password, firstName, lastName } = await req.json();

      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: Deno.env.get("COGNITO_USER_POOL_ID"),
        Username: email,
        TemporaryPassword: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "given_name", Value: firstName },
          { Name: "family_name", Value: lastName },
          { Name: "custom:status", Value: "PENDING" },
          { Name: "email_verified", Value: "true" }, // Auto-verify email
        ],
        MessageAction: "SUPPRESS", // Suppress welcome email
      });

      await cognitoClient.send(createUserCommand);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: Deno.env.get("COGNITO_USER_POOL_ID"),
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);

      return new Response(
        JSON.stringify({ message: "User created successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get pending users endpoint
    if (path === "/pending-users" && req.method === "GET") {
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: Deno.env.get("COGNITO_USER_POOL_ID"),
        Filter: 'custom:status = "PENDING"',
      });

      const { Users } = await cognitoClient.send(listUsersCommand);
      
      const pendingUsers = Users?.map(user => ({
        id: user.Username,
        email: user.Attributes?.find(attr => attr.Name === "email")?.Value,
        firstName: user.Attributes?.find(attr => attr.Name === "given_name")?.Value,
        lastName: user.Attributes?.find(attr => attr.Name === "family_name")?.Value,
        createdAt: user.UserCreateDate,
        status: "PENDING"
      })) || [];

      return new Response(JSON.stringify(pendingUsers), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Approve user endpoint
    if (path.startsWith("/approve-user/") && req.method === "POST") {
      const userId = path.split("/").pop();
      
      // Update user status
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: Deno.env.get("COGNITO_USER_POOL_ID"),
        Username: userId,
        UserAttributes: [
          { Name: "custom:status", Value: "APPROVED" }
        ],
      });

      await cognitoClient.send(updateAttributesCommand);

      // Add user to approved group
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: Deno.env.get("COGNITO_USER_POOL_ID"),
        Username: userId,
        GroupName: "Users"
      });

      await cognitoClient.send(addToGroupCommand);

      return new Response(
        JSON.stringify({ message: "User approved successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Reject user endpoint
    if (path.startsWith("/reject-user/") && req.method === "POST") {
      const userId = path.split("/").pop();
      
      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId: Deno.env.get("COGNITO_USER_POOL_ID"),
        Username: userId,
      });

      await cognitoClient.send(deleteUserCommand);

      return new Response(
        JSON.stringify({ message: "User rejected successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 404,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});