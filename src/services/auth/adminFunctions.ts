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
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('User already registered');
    }

    // Create the user
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
            email: email,
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
      .select('*')
      .eq('status', UserStatus.PENDING);

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
    // Get the user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, email')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    // Update the user's status through an Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to approve user');
    }

    // Send approval email
    await sendEmail(
      'approval',
      profile.email,
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
    // Get the user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, email')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new Error('User not found');

    // Reject the user through an Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reject-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to reject user');
    }

    // Send rejection email
    await sendEmail(
      'rejection',
      profile.email,
      profile.first_name
    );

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