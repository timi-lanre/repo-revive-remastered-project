import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import { fetchAuthSession } from 'aws-amplify/auth';

// User status enum
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

// User registration function
export const signUp = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
): Promise<{ message: string }> => {
  try {
    // Create user in Cognito with custom attributes
    const params = {
      username: email,
      password: password,
      attributes: {
        email: email,
        given_name: firstName,
        family_name: lastName,
        'custom:status': UserStatus.PENDING
      }
    };

    // Call Cognito API to create user
    const result = await fetch(`${cognitoConfig.apiUrl}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!result.ok) {
      throw new Error('Failed to create user');
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

// Get pending users function
export const getPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    // Get current session for authentication
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Call Cognito API to get pending users
    const response = await fetch(`${cognitoConfig.apiUrl}/pending-users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending users');
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

// Approve user function
export const approveUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${cognitoConfig.apiUrl}/approve-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to approve user');
    }

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

// Reject user function
export const rejectUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${cognitoConfig.apiUrl}/reject-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to reject user');
    }

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