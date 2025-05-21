
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { toast } from '@/components/ui/use-toast';

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

export const authService = {
  // Sign in function
  signIn: async (email: string, password: string) => {
    try {
      const { nextStep } = await signIn({
        username: email,
        password,
      });
      
      return { nextStep };
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      // Special handling for not confirmed users (pending approval)
      if (error.code === 'UserNotConfirmedException') {
        return { 
          isApprovalPending: true,
          message: "Your account is pending admin approval."
        };
      }
      
      throw error;
    }
  },

  // Sign up function
  signUp: async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            // Custom attribute to track approval status (this becomes available in the admin panel)
            'custom:status': UserStatus.PENDING,
          },
          // This ensures users are not auto-confirmed and need admin approval
          autoSignIn: false,
        },
      });
      
      // In a production environment, you would send an email to the admin
      // For now, we'll store the pending user in localStorage for demo purposes
      const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
      
      const newUser = {
        id: Date.now().toString(), // Generate a temporary ID
        email,
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
      };
      
      pendingUsers.push(newUser);
      localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
      
      return { 
        nextStep,
        message: "Your account has been created and is pending admin approval. You'll receive an email when your account is approved."
      };
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign out function
  signOut: async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      return await getCurrentUser();
    } catch (error) {
      console.error('Not authenticated:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens !== undefined;
    } catch {
      return false;
    }
  },
  
  // Check if user is an admin
  isAdmin: async () => {
    try {
      const user = await getCurrentUser();
      // In a real implementation, you would have a proper admin group or role
      // For this demo, we'll consider a specific email as the admin
      return user.username === "admin@example.com";
    } catch {
      return false;
    }
  },
  
  // Get pending users (in a real app, this would call Cognito admin APIs)
  getPendingUsers: () => {
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    return pendingUsers as PendingUser[];
  },
  
  // Approve user
  approveUser: (userId: string) => {
    // In a real implementation, this would use Cognito Admin APIs to confirm the user
    // For demo purposes, we'll just remove from our pendingUsers list
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    const updatedUsers = pendingUsers.filter((user: PendingUser) => user.id !== userId);
    localStorage.setItem('pendingUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "User Approved",
      description: "The user has been approved and can now log in.",
    });
    
    return { success: true };
  },
  
  // Reject user
  rejectUser: (userId: string) => {
    // In a real implementation, this would use Cognito Admin APIs to delete the user
    // For demo purposes, we'll just remove from our pendingUsers list
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    const updatedUsers = pendingUsers.filter((user: PendingUser) => user.id !== userId);
    localStorage.setItem('pendingUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "User Rejected",
      description: "The user has been rejected.",
    });
    
    return { success: true };
  }
};
