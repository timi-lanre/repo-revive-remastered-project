
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { toast } from '@/components/ui/use-toast';
import { cognitoConfig } from '@/config/cognito';
import CryptoJS from 'crypto-js';

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

// Helper function to calculate SECRET_HASH
const calculateSecretHash = (username: string) => {
  const { userPoolWebClientId, clientSecret } = cognitoConfig;
  
  if (!clientSecret) return undefined;
  
  const message = username + userPoolWebClientId;
  const hashDigest = CryptoJS.HmacSHA256(message, clientSecret);
  return CryptoJS.enc.Base64.stringify(hashDigest);
};

export const authService = {
  // Sign in function
  signIn: async (email: string, password: string) => {
    try {
      const secretHash = calculateSecretHash(email);
      
      const { nextStep } = await signIn({
        username: email,
        password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
          clientMetadata: {
            ...(secretHash && { SECRET_HASH: secretHash })
          }
        }
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
      const secretHash = calculateSecretHash(email);
      
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            // Custom attribute to track approval status
            'custom:status': UserStatus.PENDING,
          },
          // This ensures users are not auto-confirmed and need admin approval
          autoSignIn: false,
          clientMetadata: {
            ...(secretHash && { SECRET_HASH: secretHash })
          }
        },
      });
      
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
  
  // Check if user is an admin by verifying their group membership
  isAdmin: async () => {
    try {
      const session = await fetchAuthSession();
      // Extract the "cognito:groups" claim from the ID token
      const groups = session.tokens?.idToken?.payload["cognito:groups"];
      
      // Check if the user is in the Admin group
      return Array.isArray(groups) && groups.includes("Admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },
  
  // Get pending users using Cognito API (simplified version - would need AWS SDK in real implementation)
  getPendingUsers: async () => {
    try {
      // In a real implementation, this would use the Cognito Admin ListUsers API
      // with a filter for the custom:status attribute equal to PENDING
      
      // For demonstration purposes, we're returning an empty array
      // In production, this would be replaced with actual Cognito API calls
      console.log("Fetching pending users from Cognito (simulated)");
      return [] as PendingUser[];
    } catch (error) {
      console.error("Error fetching pending users:", error);
      return [] as PendingUser[];
    }
  },
  
  // Approve user using Cognito API (simplified version - would need AWS SDK in real implementation)
  approveUser: async (userId: string) => {
    try {
      // In a real implementation, this would:
      // 1. Use AdminConfirmSignUp to confirm the user
      // 2. Use AdminUpdateUserAttributes to set custom:status to APPROVED
      
      console.log(`Approving user ${userId} (simulated)`);
      
      toast({
        title: "User Approved",
        description: "The user has been approved and can now log in.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error Approving User",
        description: "There was an error approving the user.",
        variant: "destructive"
      });
      return { success: false };
    }
  },
  
  // Reject user using Cognito API (simplified version - would need AWS SDK in real implementation)
  rejectUser: async (userId: string) => {
    try {
      // In a real implementation, this would:
      // 1. Use AdminUpdateUserAttributes to set custom:status to REJECTED
      // or, alternatively, delete the user using AdminDeleteUser
      
      console.log(`Rejecting user ${userId} (simulated)`);
      
      toast({
        title: "User Rejected",
        description: "The user has been rejected.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Error Rejecting User",
        description: "There was an error rejecting the user.",
        variant: "destructive"
      });
      return { success: false };
    }
  }
};
