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
    // Create the user through the auth function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/signup`, {
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
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    return { message: "User registration request submitted successfully" };
  } catch (error: any) {
    console.error('Error during registration:', error);
    throw error;
  }
};

export const deleteUser = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/pending-users`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending users');
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

export const approveUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/approve-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to approve user');
    }

    // Get user details for email notification
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', userId)
      .single();

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);

    if (profile && user?.email) {
      await sendEmail('approval', user.email, profile.first_name);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error approving user:", error);
    throw error;
  }
};

export const rejectUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/reject-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reject user');
    }

    // Get user details for email notification
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', userId)
      .single();

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);

    if (profile && user?.email) {
      await sendEmail('rejection', user.email, profile.first_name);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting user:", error);
    throw error;
  }
};

export const resetPassword = async (userId: string): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/reset-password/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to trigger password reset');
    }
  } catch (error: any) {
    console.error("Error resetting password:", error);
    throw error;
  }
};