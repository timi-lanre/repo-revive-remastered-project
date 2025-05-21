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
    // First create the user in Auth
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          status: UserStatus.PENDING
        }
      }
    });

    if (authError) throw authError;
    if (!user) throw new Error('Failed to create user');

    // Then create the user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          status: UserStatus.PENDING,
          role: 'user'
        }
      ]);

    if (profileError) {
      // If profile creation fails, we should delete the auth user
      await supabase.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    return { message: "User registration request submitted successfully" };
  } catch (error: any) {
    console.error('Error during registration:', error);
    throw error;
  }
};

export const deleteUser = async (email: string): Promise<void> => {
  try {
    // First get the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const userToDelete = users.find(u => u.email === email);
    if (!userToDelete) {
      throw new Error('User not found');
    }

    // Delete from auth.users
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      userToDelete.id
    );
    if (deleteError) throw deleteError;

    // Also delete from user_profiles if it exists
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userToDelete.id);

  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, status, created_at')
      .eq('status', UserStatus.PENDING);

    if (error) throw error;

    // Get emails from auth.users for each profile
    const users = await Promise.all(
      profiles.map(async (profile) => {
        const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
        return {
          id: profile.user_id,
          email: user?.email || 'No email available',
          firstName: profile.first_name,
          lastName: profile.last_name,
          createdAt: profile.created_at,
          status: profile.status as UserStatus
        };
      })
    );

    return users;
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

export const approveUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) throw new Error('User not found in auth system');

    // Update profile status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status: UserStatus.APPROVED })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Send approval email
    await sendEmail(
      'approval',
      user.email,
      profile.first_name
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error approving user:", error);
    throw error;
  }
};

export const rejectUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) throw new Error('User not found in auth system');

    // Update profile status
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status: UserStatus.REJECTED })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Send rejection email
    await sendEmail(
      'rejection',
      user.email,
      profile.first_name
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting user:", error);
    throw error;
  }
};