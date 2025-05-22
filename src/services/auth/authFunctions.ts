import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error('Login failed: Invalid credentials');
    }

    // Get user's role/status from user_profiles with limit(1) to ensure single row
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('status, role')
      .eq('user_id', data.user.id)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Error fetching user profile. Please contact support.');
    }

    if (!profile) {
      throw new Error('User profile not found. Please contact support to set up your account.');
    }

    if (profile.status !== 'APPROVED') {
      throw new Error('Your account is pending approval. Please contact support for assistance.');
    }

    toast({
      title: "Login Successful",
      description: "You've been successfully logged in."
    });

    // Redirect based on role
    window.location.href = profile.role === 'admin' ? '/admin' : '/dashboard';
    return { success: true };
  } catch (error: any) {
    console.error('Error during login:', error);
    
    toast({
      title: "Login Failed",
      description: error.message || "There was an error during login.",
      variant: "destructive"
    });
    
    return { success: false };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    window.location.href = "/";
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};