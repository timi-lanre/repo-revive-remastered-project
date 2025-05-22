import { supabase } from '@/lib/supabase';

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting auth user:', authError);
      return null;
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
        console.error('Error getting user profile:', profileError);
        return null;
      }

      return {
        ...user,
        ...profile
      };
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch {
    return false;
  }
};

export const isAdmin = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return user?.role === 'admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};