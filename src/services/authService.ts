
import { Auth } from 'aws-amplify';

export const authService = {
  // Sign in function
  signIn: async (email: string, password: string) => {
    try {
      const user = await Auth.signIn(email, password);
      return user;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign up function
  signUp: async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: firstName,
          family_name: lastName,
        },
      });
      return user;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign out function
  signOut: async () => {
    try {
      await Auth.signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      return await Auth.currentAuthenticatedUser();
    } catch (error) {
      console.error('Not authenticated:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      await Auth.currentAuthenticatedUser();
      return true;
    } catch {
      return false;
    }
  },
};

