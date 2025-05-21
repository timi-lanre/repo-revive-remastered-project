import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmjaibmzumppeicvsbws.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptamFpYm16dW1wcGVpY3ZzYndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjM1MzgsImV4cCI6MjA2MzQzOTUzOH0.3K1GyPANAjBk_-6M-1m0pQIoS0wgWB9SyhLjO1HhzR4';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);