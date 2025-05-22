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
        .maybeSingle();

      if (profileError) {
        console.error('Error getting user profile:', profileError.message);
        throw new Error(`Profile error: ${profileError.message}`);
      }

      if (!profile) {
        console.error('No profile found for user');
        throw new Error('User profile not found');
      }

      return {
        ...user,
        ...profile
      };
    } catch (profileError) {
      if (profileError instanceof Error && profileError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Supabase');
      }
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to fetch user profile data');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to Supabase');
    }
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
    if (!user) {
      throw new Error('No user found');
    }
    return user?.role === 'admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    if (error instanceof Error && error.message.includes('Network error')) {
      throw new Error('Unable to verify admin status due to network issues. Please check your connection.');
    }
    throw new Error('Failed to verify admin status');
  }
};