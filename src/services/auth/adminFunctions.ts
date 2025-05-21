
import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';

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
}

// User registration function
export const signUp = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
): Promise<{ message: string }> => {
  try {
    // This is a stub function - implement according to requirements
    toast({
      title: "Account Request Submitted",
      description: "Your account has been created and is pending admin approval."
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

// Get pending users function (returns mock data for UI testing)
export const getPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    // Return mock data for testing the admin interface
    return [
      {
        id: "user1",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date().toISOString()
      },
      {
        id: "user2",
        email: "jane.smith@example.com",
        firstName: "Jane",
        lastName: "Smith",
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: "user3",
        email: "robert.johnson@example.com",
        firstName: "Robert",
        lastName: "Johnson",
        createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ];
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

// Approve user function
export const approveUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // Mock implementation
    toast({
      title: "User Approved",
      description: "User has been successfully approved."
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
    // Mock implementation
    toast({
      title: "User Rejected",
      description: "User has been rejected."
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
