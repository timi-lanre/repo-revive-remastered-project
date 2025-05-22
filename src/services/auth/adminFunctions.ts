
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
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('Creating user:', { firstName, lastName, email });
    
    // Generate a random password
    const password = generateRandomPassword();
    
    // Try to use the Edge Function first
    try {
      console.log('Attempting to create user via Edge Function');
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
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP error: ${response.status} ${response.statusText}` 
        }));
        
        console.error('Edge Function error:', errorData);
        
        if (response.status === 404) {
          console.log('Edge Function not found, falling back to direct API');
          const result = await createUserDirectly(email, password, firstName, lastName);
          return { 
            ...result, 
            message: "User created via direct API (Edge Function not available)"
          };
        }
        
        throw new Error(errorData.error || `Failed to create user: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('User created successfully via Edge Function:', result);
      return { 
        success: true,
        message: "User created successfully via Edge Function" + (result.emailSent ? " and welcome email sent" : "")
      };
      
    } catch (edgeError: any) {
      console.error('Edge Function failed, falling back to direct API:', edgeError);
      
      // Check if it's a network error (offline)
      if (edgeError instanceof TypeError && edgeError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Please check your internet connection and try again.');
      }
      
      return await createUserDirectly(email, password, firstName, lastName);
    }
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Direct API implementation as fallback
const createUserDirectly = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('Creating user directly via Supabase API');
    
    // First check if user already exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();
      
    if (queryError) {
      console.error('Error checking existing user:', queryError);
      throw new Error('Failed to check if user exists');
    }
    
    if (existingUsers) {
      throw new Error('A user with this email already exists');
    }
    
    // Create the user with auth API
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    if (signUpError) {
      console.error('Error signing up user:', signUpError);
      throw signUpError;
    }
    
    if (!data.user) {
      throw new Error('Failed to create user account');
    }
    
    console.log('User created successfully:', data.user.id);
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: data.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          status: "APPROVED", // Auto-approve admin-created users
          role: "user"
        }
      ]);
      
    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }
    
    // Since we're not using Edge Functions, we don't have the send-email functionality
    // Log the password for development purposes
    console.log(`Password for ${email}: ${password} (would be sent via email)`);
    
    // Attempt to send welcome email directly if possible
    try {
      // This is just a failsafe attempt in case the email function is available
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'account_created',
          email,
          firstName,
          password,
          loginUrl: `${window.location.origin}/login`
        }),
      });
      console.log('Attempted to send welcome email');
    } catch (emailError) {
      console.warn('Could not send welcome email:', emailError);
      // Don't fail if email sending fails
    }
    
    return { 
      success: true,
      message: `User created successfully. Password: ${password} (this would normally be sent by email)`
    };
  } catch (error: any) {
    console.error('Error in direct user creation:', error);
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
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error("Error resetting password:", error);
    throw error;
  }
};
