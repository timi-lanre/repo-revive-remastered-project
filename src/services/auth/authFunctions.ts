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

    if (data?.user) {
      // Get user's role/status from custom claims or metadata
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('status, role')
        .eq('user_id', data.user.id)
        .single();

      if (profile?.status !== 'APPROVED') {
        throw new Error('Your account is pending approval');
      }

      toast({
        title: "Login Successful",
        description: "You've been successfully logged in."
      });

      return { success: true };
    }

    throw new Error('Login failed');
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