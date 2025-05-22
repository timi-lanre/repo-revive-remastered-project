import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import mysql from 'npm:mysql2/promise';

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
  host: Deno.env.get("MYSQL_HOST"),
  port: parseInt(Deno.env.get("MYSQL_PORT") || "3306"),
  user: Deno.env.get("MYSQL_USER"),
  password: Deno.env.get("MYSQL_PASSWORD"),
  database: Deno.env.get("MYSQL_DATABASE")
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Connect to MySQL
    const connection = await mysql.createConnection(mysqlConfig);
    
    // Get data from MySQL
    const [rows] = await connection.execute('SELECT DISTINCT * FROM `data`');
    await connection.end();

    // Transform data to match Supabase schema
    const advisors = rows.map((row: any) => ({
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
    let totalInserted = 0;
    const startTime = Date.now();

    for (let i = 0; i < advisors.length; i += batchSize) {
      const batch = advisors.slice(i, i + batchSize);
      const { error } = await supabase
        .from('advisors')
        .insert(batch);
      
      if (error) throw error;

      totalInserted += batch.length;
      console.log(`Migrated ${totalInserted} of ${advisors.length} advisors`);
    }

    const duration = (Date.now() - startTime) / 1000;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully migrated ${totalInserted} advisors in ${duration.toFixed(2)} seconds` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});