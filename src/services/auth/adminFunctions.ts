// src/services/auth/adminFunctions.ts
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export enum UserStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  status: UserStatus;
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

const sendEmail = async (type: 'approval' | 'rejection' | 'account_created', email: string, firstName: string, password?: string) => {
  try {
    console.log('Sending email:', { type, email, firstName });
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        type, 
        email, 
        firstName, 
        password,
        loginUrl: 'https://advisorconnect.ca/login'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email API response:', errorText);
      throw new Error('Failed to send email notification');
    }
    
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw here - we don't want email failures to prevent user creation
  }
};

export const createUser = async (
  firstName: string, 
  lastName: string, 
  email: string
): Promise<{ success: boolean }> => {
  try {
    // Check if user already exists in auth.users
    const { data: existingAuthUsers, error: authCheckError } = await supabase.auth.admin.listUsers();
    
    if (authCheckError) {
      console.error('Error checking existing auth users:', authCheckError);
      throw new Error(`Failed to check existing users: ${authCheckError.message}`);
    }

    const existingAuthUser = existingAuthUsers.users.find(user => user.email === email);
    if (existingAuthUser) {
      throw new Error("A user with this email already exists");
    }

    // Check if user exists in profiles table
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();
      
    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError);
      throw new Error(`Database error: ${profileCheckError.message}`);
    }

    if (existingProfile) {
      throw new Error("A user with this email already exists");
    }

    // Generate a random password
    const password = generateRandomPassword();
    
    // Create user via the Edge Function
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
      const errorText = await response.text();
      console.error('Error response from create-user function:', errorText);
      throw new Error(`Failed to create user: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create user');
    }

    // Send welcome email with login details
    await sendEmail('account_created', email, firstName, password);

    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const signUp = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
): Promise<{ message: string }> => {
  try {
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (authError) throw authError;
    if (!user) throw new Error("Failed to create user");

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          status: "PENDING",
          role: "user"
        }
      ]);

    if (profileError) {
      await supabase.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    return { message: "User registration request submitted successfully" };
  } catch (error: any) {
    console.error('Error during registration:', error);
    throw error;
  }
};

export const getPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'PENDING');

    if (error) throw error;

    return profiles.map(profile => ({
      id: profile.user_id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      createdAt: profile.created_at,
      status: profile.status as UserStatus
    }));
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

export const approveUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status: "APPROVED" })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, email')
      .eq('user_id', userId)
      .single();

    if (profile?.email) {
      await sendEmail('approval', profile.email, profile.first_name);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error approving user:", error);
    throw error;
  }
};

export const rejectUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status: "REJECTED" })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, email')
      .eq('user_id', userId)
      .single();

    if (profile?.email) {
      await sendEmail('rejection', profile.email, profile.first_name);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting user:", error);
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
