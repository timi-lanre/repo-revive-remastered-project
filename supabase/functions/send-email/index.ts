// supabase/functions/send-email/index.ts
import { SmtpClient } from "npm:smtp-client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const smtpClient = new SmtpClient({
  hostname: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
  port: 587,
  username: Deno.env.get("SMTP_USERNAME"),
  password: Deno.env.get("SMTP_PASSWORD"),
});

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { type, email, firstName, password, loginUrl } = await req.json();

    let subject = "";
    let body = "";
    
    // Use the provided loginUrl, or fallback to your production domain
    const appUrl = loginUrl || 
                   Deno.env.get("APP_URL") || 
                   'https://advisorconnect.ca/login';

    if (type === "approval") {
      subject = "Your Advisor Connect Account Has Been Approved";
      body = `
Dear ${firstName},

Great news! Your Advisor Connect account has been approved. You can now log in to your account and start using our platform.

Click here to login: ${appUrl}

Best regards,
The Advisor Connect Team
      `;
    } else if (type === "rejection") {
      subject = "Advisor Connect Account Status Update";
      body = `
Dear ${firstName},

Thank you for your interest in Advisor Connect. After reviewing your application, we regret to inform you that we are unable to approve your account at this time.

If you believe this was in error or would like to discuss this further, please contact our support team.

Best regards,
The Advisor Connect Team
      `;
    } else if (type === "account_created") {
      subject = "Welcome to Advisor Connect - Your Account Details";
      body = `
Dear ${firstName},

Welcome to Advisor Connect! An account has been created for you by an administrator.

Here are your login details:
- Email: ${email}
- Temporary Password: ${password}

Please login at: ${appUrl}

For security reasons, we recommend changing your password after your first login.

Best regards,
The Advisor Connect Team
      `;
    }

    console.log(`Sending ${type} email to ${email}`);
    console.log(`Login URL: ${appUrl}`);

    await smtpClient.send({
      from: Deno.env.get("SMTP_FROM") || "noreply@advisorconnect.com",
      to: [email],
      subject: subject,
      content: body,
    });

    console.log(`Email sent successfully to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
