import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { 
  SESClient, 
  SendEmailCommand,
  SendEmailCommandInput,
  VerifyEmailIdentityCommand,
  ListVerifiedEmailAddressesCommand 
} from "npm:@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const sesClient = new SESClient({
  region: Deno.env.get("AWS_REGION") || "us-east-1",
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
  },
});

async function verifyEmailIdentity(email: string) {
  try {
    const command = new VerifyEmailIdentityCommand({ EmailAddress: email });
    await sesClient.send(command);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error verifying email ${email}:`, error);
    return false;
  }
}

async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const command = new ListVerifiedEmailAddressesCommand({});
    const response = await sesClient.send(command);
    return response.VerifiedEmailAddresses?.includes(email) || false;
  } catch (error) {
    console.error("Error checking verified emails:", error);
    return false;
  }
}

async function sendEmail(to: string, subject: string, body: string) {
  try {
    const fromEmail = Deno.env.get("AWS_SES_FROM_EMAIL") || "advisorconnectdev@gmail.com";
    
    // Check if recipient email is verified
    if (!await isEmailVerified(to)) {
      console.log(`Email ${to} not verified. Attempting verification...`);
      await verifyEmailIdentity(to);
      return; // Skip sending email until verified
    }

    const params: SendEmailCommandInput = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: body,
            Charset: "UTF-8",
          },
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #E5D3BC; padding: 20px; text-align: center;">
                  <h1 style="color: #333; margin: 0;">Advisor Connect</h1>
                </div>
                <div style="padding: 20px; background-color: #fff; border: 1px solid #ddd;">
                  ${body.replace(/\n/g, "<br>")}
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                  © 2025 Advisor Connect. All rights reserved.
                </div>
              </div>
            `,
            Charset: "UTF-8",
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/auth", "");
    
    if (path === "/create-user" && req.method === "POST") {
      const { email, password, firstName, lastName } = await req.json();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return new Response(
          JSON.stringify({ success: false, error: "User already exists" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Create the user with auth API
      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        }
      });

      if (authError) {
        console.error("Auth error creating user:", authError);
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create user" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            status: "APPROVED", // Auto-approve admin-created users
            role: "user"
          }
        ]);

      if (profileError) {
        // Clean up by deleting the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(user.id);
        
        console.error("Profile error creating user:", profileError);
        return new Response(
          JSON.stringify({ success: false, error: profileError.message }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            id: user.id,
            email: user.email
          } 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (path === "/pending-users" && req.method === "GET") {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, status, created_at')
        .eq('status', 'PENDING');

      if (error) throw error;

      const users = await Promise.all(
        profiles.map(async (profile) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
          return {
            id: profile.user_id,
            email: user?.email || 'No email available',
            firstName: profile.first_name,
            lastName: profile.last_name,
            createdAt: profile.created_at,
            status: profile.status
          };
        })
      );

      return new Response(JSON.stringify(users), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (path.startsWith("/approve-user/") && req.method === "POST") {
      const userId = path.split("/").pop();
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ status: "APPROVED" })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const { data: { user } } = await supabase.auth.admin.getUserById(userId);

      if (profile && user?.email) {
        await sendEmail(
          user.email,
          "Your Advisor Connect Account Has Been Approved",
          `Dear ${profile.first_name},\n\nYour account has been approved. You can now log in to Advisor Connect.\n\nBest regards,\nThe Advisor Connect Team`
        );
      }

      return new Response(
        JSON.stringify({ message: "User approved successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (path.startsWith("/reject-user/") && req.method === "POST") {
      const userId = path.split("/").pop();

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ status: "REJECTED" })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const { data: { user } } = await supabase.auth.admin.getUserById(userId);

      if (profile && user?.email) {
        await sendEmail(
          user.email,
          "Advisor Connect Account Status Update",
          `Dear ${profile.first_name},\n\nWe regret to inform you that your account request has been rejected.\n\nBest regards,\nThe Advisor Connect Team`
        );
      }

      return new Response(
        JSON.stringify({ message: "User rejected successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (path.startsWith("/reset-password/") && req.method === "POST") {
      const userId = path.split("/").pop();
      
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError) throw userError;
      
      if (!user?.email) throw new Error("User email not found");

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', userId)
        .single();

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: `${Deno.env.get('VITE_SUPABASE_URL')}/auth/v1/callback`,
        }
      });

      if (error) throw error;

      if (data?.properties?.action_link) {
        await sendEmail(
          user.email,
          "Reset Your Advisor Connect Password",
          `Dear ${profile?.first_name || 'User'},

          You've requested to reset your password for Advisor Connect. Click the link below to set a new password:

          ${data.properties.action_link}

          If you didn't request this change, please ignore this email or contact support if you have concerns.

          Best regards,
          The Advisor Connect Team`
        );
      }

      return new Response(
        JSON.stringify({ message: "Password reset email sent" }),
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
