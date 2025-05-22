import { supabase } from '@/lib/supabase';

export const runMigration = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/migrate-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Migration failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};