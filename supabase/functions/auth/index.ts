import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Supabase client with service role key
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

      // First check if user exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("User already exists");
      }

      // Create auth user
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

      // Create user profile
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
        // Rollback: delete auth user if profile creation fails
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

    // Get pending users endpoint
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

    // Approve user endpoint
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

    // Reject user endpoint
    if (path.startsWith("/reject-user/") && req.method === "POST") {
      const userId = path.split("/").pop();

      // Update profile status
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