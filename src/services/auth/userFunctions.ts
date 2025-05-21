import { supabase } from '@/lib/supabase';

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) return null;

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    return {
      ...user,
      ...profile
    };
  } catch (error) {
    console.error('Error getting current user:', error);
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