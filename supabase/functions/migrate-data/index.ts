import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Client } from "npm:mysql2/promise";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

// MySQL configuration
const mysqlConfig = {
  host: 'advisorwebapp.crcke66wq2ed.ca-central-1.rds.amazonaws.com',
  port: 3306,
  user: 'Admin',
  password: '28UKOJi3OshzZT',
  database: 'advisor_dashboard'
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Connect to MySQL
    const conn = await new Client(mysqlConfig);
    
    // Get data from MySQL
    const [rows] = await conn.query('SELECT DISTINCT * FROM `data`');
    await conn.end();

    // Transform data to match Supabase schema
    const advisors = rows.map(row => ({
      id: crypto.randomUUID(),
      first_name: row['First Name'],
      last_name: row['Last Name'],
      team_name: row['Team Name'],
      title: row['Title'],
      firm: row['Firm'],
      branch: row['Branch'],
      city: row['City'],
      province: row['Province'],
      email: row['Email'],
      linkedin_url: row['LinkedIn URL'],
      website_url: row['Website URL'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert data into Supabase in batches
    const batchSize = 100;
    for (let i = 0; i < advisors.length; i += batchSize) {
      const batch = advisors.slice(i, i + batchSize);
      const { error } = await supabase
        .from('advisors')
        .insert(batch);
      
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully migrated ${advisors.length} advisors` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});