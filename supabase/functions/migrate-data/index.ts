import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import * as mysql from 'npm:mysql2@3.9.2/promise';

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
  database: Deno.env.get("MYSQL_DATABASE"),
  ssl: {
    rejectUnauthorized: true
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting migration process...");
    console.log("Connecting to MySQL database...");

    // Create MySQL connection
    const connection = await mysql.createConnection(mysqlConfig);
    console.log("MySQL connection established");

    // Get data from MySQL
    console.log("Fetching data from MySQL...");
    const [rows] = await connection.execute('SELECT DISTINCT * FROM `data`');
    await connection.end();
    console.log(`Fetched ${Array.isArray(rows) ? rows.length : 0} rows from MySQL`);

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No data retrieved from MySQL");
    }

    // Transform data to match Supabase schema
    console.log("Transforming data...");
    const advisors = rows.map((row: any) => ({
      id: crypto.randomUUID(),
      first_name: row['First Name'] || '',
      last_name: row['Last Name'] || '',
      team_name: row['Team Name'] || null,
      title: row['Title'] || null,
      firm: row['Firm'] || '',
      branch: row['Branch'] || null,
      city: row['City'] || null,
      province: row['Province'] || null,
      email: row['Email'] || null,
      linkedin_url: row['LinkedIn URL'] || null,
      website_url: row['Website URL'] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert data into Supabase in batches
    const batchSize = 50;
    let totalInserted = 0;
    const startTime = Date.now();

    console.log(`Starting batch inserts (${batchSize} records per batch)...`);

    for (let i = 0; i < advisors.length; i += batchSize) {
      const batch = advisors.slice(i, i + batchSize);
      const { error } = await supabase
        .from('advisors')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }

      totalInserted += batch.length;
      console.log(`Progress: ${totalInserted}/${advisors.length} records inserted`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Migration completed in ${duration.toFixed(2)} seconds`);

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
      JSON.stringify({ 
        error: error.message || "An unknown error occurred",
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});