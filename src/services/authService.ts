
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { toast } from '@/components/ui/use-toast';

// User status enum
export enum UserStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
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
      
      // Simulate sending an approval email to admin (in real app, this would be a backend call)
      console.log(`[ADMIN NOTIFICATION] New user registration: ${email}, ${firstName} ${lastName} needs approval`);
      
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
  
  // FOR TESTING: Simulate admin approval flow
  // In a real application, this would be a secured admin endpoint
  simulateAdminApproval: async (email: string) => {
    // In a real implementation, this would make API calls to AWS Cognito Admin APIs
    // to confirm the user and change their status
    
    toast({
      title: "Admin Approval Simulated",
      description: `User ${email} would be approved in a real implementation.`,
    });
    
    return {
      success: true,
      message: `In a production environment, ${email} would now be approved and able to log in.`
    };
  }
};
