
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    console.log('Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      throw error;
    }

    if (!data?.user) {
      console.error('Login failed: No user data returned');
      throw new Error('Login failed: Invalid credentials');
    }

    console.log('Auth login successful, fetching profile');

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
      console.error('No profile found for user:', data.user.id);
      throw new Error('User profile not found. Please contact support to set up your account.');
    }

    console.log('User profile found:', { status: profile.status, role: profile.role });

    if (profile.status !== 'APPROVED') {
      console.error('User account not approved');
      throw new Error('Your account is pending approval. Please contact support for assistance.');
    }

    toast({
      title: "Login Successful",
      description: "You've been successfully logged in."
    });

    console.log('Login complete, redirecting user based on role:', profile.role);
    
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
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
    
    console.log('Sign out successful, redirecting to home page');
    window.location.href = "/";
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};
