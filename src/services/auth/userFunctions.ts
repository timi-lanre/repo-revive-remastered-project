import { supabase } from '@/lib/supabase';

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting auth user:', authError.message);
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) return null;

    try {
      // Get user profile with specific columns
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, role, status')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error getting user profile:', profileError.message);
        throw new Error(`Profile error: ${profileError.message}`);
      }

      return {
        ...user,
        ...profile
      };
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to fetch user profile data');
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error instanceof Error ? error : new Error('Failed to get current user');
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

export const isAdmin = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return user?.role === 'admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    throw new Error('Failed to verify admin status');
  }
};