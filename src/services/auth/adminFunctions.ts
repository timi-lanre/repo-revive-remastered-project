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
        loginUrl: window.location.origin + '/login'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const createUser = async (
  firstName: string, 
  lastName: string, 
  email: string
): Promise<{ success: boolean }> => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Generate a random password
    const password = generateRandomPassword();

    // Create the user in Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (authError) throw authError;
    if (!user) throw new Error("Failed to create user");

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          status: "APPROVED", // Auto-approve admin-created users
          role: "user"
        }
      ]);

    if (profileError) {
      // Clean up by deleting the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw profileError;
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
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error("Error resetting password:", error);
    throw error;
  }
};
