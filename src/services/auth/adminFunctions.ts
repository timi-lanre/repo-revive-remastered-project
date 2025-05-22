
// src/services/auth/adminFunctions.ts
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export enum UserStatus {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

const generateRandomPassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

export const createUser = async (
  firstName: string, 
  lastName: string, 
  email: string
): Promise<{ success: boolean }> => {
  try {
    console.log('Creating user via Edge Function:', { firstName, lastName, email });
    
    // Generate a random password
    const password = generateRandomPassword();
    
    // Create user via the Edge Function - this handles all checks and creation in one call
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from create-user function:', errorData);
      throw new Error(errorData.error || 'Failed to create user');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create user');
    }

    console.log('User created successfully:', result);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const resetPassword = async (userId: string): Promise<void> => {
  try {
    // First get the user's email
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.email) {
      throw new Error('Could not find user email');
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `https://advisorconnect.ca/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error("Error resetting password:", error);
    throw error;
  }
};
