
import { loginWithEmailPassword, signOut } from './authFunctions';
import { getCurrentUser, isAuthenticated, isAdmin } from './userFunctions';
import { 
  resetPassword,
  createUser,
  UserStatus
} from './adminFunctions';

// Export the authService object with all functions
export const authService = {
  signOut,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  resetPassword,
  createUser,
  loginWithEmailPassword
};

// Re-export types
export { UserStatus };
