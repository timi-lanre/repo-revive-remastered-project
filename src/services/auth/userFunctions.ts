
import { cognitoConfig } from '@/config/cognito';

// Get current authenticated user
export const getCurrentUser = async () => {
  try {
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) return null;
    
    return JSON.parse(userInfoStr);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const accessToken = localStorage.getItem('access_token');
    return !!accessToken;
  } catch {
    return false;
  }
};

// Check if user is an admin by verifying their group membership
export const isAdmin = async (): Promise<boolean> => {
  try {
    const idToken = localStorage.getItem('id_token');
    if (!idToken) return false;
    
    // Parse the ID token (without verification, as we trust our local storage)
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    // Extract the "cognito:groups" claim
    const groups = payload["cognito:groups"];
    
    // Check if the user is in the Admin group
    return Array.isArray(groups) && groups.includes("Admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
