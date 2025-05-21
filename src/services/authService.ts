
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export const authService = {
  // Sign in function
  signIn: async (email: string, password: string) => {
    try {
      const { nextStep } = await signIn({
        username: email,
        password,
      });
      
      // Check if there's a next step (like custom challenge for admin approval)
      return { nextStep };
    } catch (error: any) {
      console.error('Error signing in:', error);
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
          },
        },
      });
      return { nextStep };
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
};
