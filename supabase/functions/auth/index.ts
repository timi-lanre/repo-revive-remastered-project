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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

async function isEmailVerified(email: string): Promise<boolean> {
  // Skip verification check if SKIP_EMAIL_VERIFICATION is true
  if (Deno.env.get("SKIP_EMAIL_VERIFICATION") === "true") {
    return true;
  }

  try {
    const command = new ListVerifiedEmailAddressesCommand({});
    const response = await sesClient.send(command);
    
    // If email isn't verified, attempt to verify it
    if (!response.VerifiedEmailAddresses?.includes(email)) {
      const verifyCommand = new VerifyEmailIdentityCommand({ EmailAddress: email });
      await sesClient.send(verifyCommand);
      console.log(`Verification email sent to ${email}`);
    }
    
    return true; // Return true since we've initiated verification
  } catch (error) {
    console.error("Error checking/verifying email:", error);
    return false;
  }
}

async function sendEmail(to: string, subject: string, body: string) {
  try {
    // Always verify sender email
    const senderEmail = "advisorconnectdev@gmail.com";
    await isEmailVerified(senderEmail);

    // Attempt to verify recipient email
    await isEmailVerified(to);

    const params: SendEmailCommandInput = {
      Source: senderEmail,
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
            Data: body.replace(/\n/g, "<br>"),
            Charset: "UTF-8",
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  } catch (error) {
    console.error("Error sending email:", error);
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

    if (path === "/signup" && req.method === "POST") {
      const { email, password, firstName, lastName } = await req.json();

      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("User already exists");
      }

      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (authError) throw authError;
      if (!user) throw new Error("Failed to create user");

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            status: "PENDING",
            role: "user"
          }
        ]);

      if (profileError) {
        await supabase.auth.admin.deleteUser(user.id);
        throw profileError;
      }

      return new Response(
        JSON.stringify({ message: "User created successfully" }),
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
      
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        userId,
      });

      if (error) throw error;

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