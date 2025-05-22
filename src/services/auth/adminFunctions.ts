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

const sendEmail = async (type: 'approval' | 'rejection', email: string, firstName: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, email, firstName }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }
  } catch (error) {
    console.error('Error sending email:', error);
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
      // Rollback: delete auth user if profile creation fails
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (!profile?.email) {
      throw new Error('User email not found');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
    
    if (error) throw error;
  } catch (error: any) {
    console.error("Error resetting password:", error);
    throw error;
  }
};