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

// Test the connection and provide better error messages
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
  if (!session && event === 'SIGNED_OUT') {
    console.log('User signed out or session expired');
  }
});

// Export a function to check connection status
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};