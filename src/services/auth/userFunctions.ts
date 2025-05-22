import { supabase } from '@/lib/supabase';

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting auth user:', authError.message);
      if (authError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to authentication service. Please check your internet connection.');
      }
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
        if (profileError.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to connect to database. Please check your internet connection.');
        }
        throw new Error(`Profile error: ${profileError.message}`);
      }

      if (!profile) {
        console.error('No profile found for user');
        throw new Error('User profile not found. Please contact support.');
      }

      return {
        ...user,
        ...profile
      };
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error instanceof Error ? error : new Error('Failed to get current user');
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session check error:', error);
      return false;
    }
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
      throw new Error('No user found. Please sign in again.');
    }
    return user?.role === 'admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    if (error instanceof Error) {
      if (error.message.includes('Network error')) {
        throw new Error('Unable to verify admin status due to network issues. Please check your internet connection and try again.');
      }
      throw error;
    }
    throw new Error('Failed to verify admin status. Please try again later.');
  }
};