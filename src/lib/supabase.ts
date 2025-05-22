
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your .env file.`);
}

// Log the URL being used (without the key for security)
console.log('Connecting to Supabase URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  // Add retries for network issues
  db: {
    schema: 'public'
  }
});

// Export a function to check connection status
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    if (error) {
      console.error("Connection test failed:", error.message);
      throw error;
    }
    console.log("Supabase connection test successful");
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

// Check if the current user is authenticated
export const isSessionValid = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session check failed:", error.message);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error("Session check error:", error);
    return false;
  }
};
