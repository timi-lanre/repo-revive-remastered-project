// supabase/functions/auth/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

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

      console.log('Creating user:', { email, firstName, lastName });

      // Check if user already exists in auth.users
      const { data: existingAuthUsers, error: authListError } = await supabase.auth.admin.listUsers();
      
      if (authListError) {
        console.error("Error listing users:", authListError);
        return new Response(
          JSON.stringify({ success: false, error: `Failed to check existing users: ${authListError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      const existingAuthUser = existingAuthUsers.users.find(user => user.email === email);
      if (existingAuthUser) {
        return new Response(
          JSON.stringify({ success: false, error: "User already exists" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Check if user exists in profiles table
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
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

      console.log('User created successfully:', user.id);

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
        console.error("Profile error creating user:", profileError);
        await supabase.auth.admin.deleteUser(user.id);
        
        return new Response(
          JSON.stringify({ success: false, error: `Failed to create user profile: ${profileError.message}` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      console.log('User profile created successfully');

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

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: `https://advisorconnect.ca/reset-password`,
        }
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          message: "Password reset link generated",
          reset_link: data?.properties?.action_link 
        }),
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
