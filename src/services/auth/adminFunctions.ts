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
    // Don't throw the error - we don't want to block the approval/rejection process
    // just because the email failed to send
  }
};

export const signUp = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
): Promise<{ message: string }> => {
  try {
    // First check if a user with this email already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('user_profiles')
      .select('users!inner(email)')
      .eq('users.email', email)
      .maybeSingle();

    if (lookupError) throw lookupError;
    
    if (existingUser) {
      throw new Error('An account with this email already exists. Please use a different email or try logging in.');
    }

    const { data: { user }, error } = await supabase.auth.signUp({
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

    if (error) throw error;

    if (user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            status: UserStatus.PENDING
          }
        ]);

      if (profileError) throw profileError;
    }

    toast({
      title: "Account Request Submitted",
      description: "Your account has been created and is pending admin approval. You will receive an email once your account is approved."
    });
    
    return { message: "User registration request submitted successfully" };
  } catch (error: any) {
    console.error('Error during registration:', error);
    toast({
      title: "Registration Failed",
      description: error.message || "There was an error during registration.",
      variant: "destructive"
    });
    throw error;
  }
};

export const getPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        status,
        created_at,
        users:user_id (email)
      `)
      .eq('status', UserStatus.PENDING);

    if (error) throw error;

    return profiles.map(profile => ({
      id: profile.user_id,
      email: profile.users.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      createdAt: profile.created_at,
      status: profile.status
    }));
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

export const approveUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // First get the user's details for the email
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, users!inner(email)')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Update the user's status
    const { error } = await supabase
      .from('user_profiles')
      .update({ status: UserStatus.APPROVED })
      .eq('user_id', userId);

    if (error) throw error;

    // Send approval email
    await sendEmail(
      'approval',
      profile.users.email,
      profile.first_name
    );

    toast({
      title: "User Approved",
      description: "User has been successfully approved and notified via email."
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error approving user:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to approve user.",
      variant: "destructive"
    });
    return { success: false };
  }
};

export const rejectUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // First get the user's details for the email
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, users!inner(email)')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status: UserStatus.REJECTED })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Send rejection email
    await sendEmail(
      'rejection',
      profile.users.email,
      profile.first_name
    );

    // Delete the user's auth account
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    toast({
      title: "User Rejected",
      description: "User has been rejected and notified via email."
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting user:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to reject user.",
      variant: "destructive"
    });
    return { success: false };
  }
};