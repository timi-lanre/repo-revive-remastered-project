
import { loginWithEmailPassword, signOut } from './authFunctions';
import { getCurrentUser, isAuthenticated, isAdmin } from './userFunctions';
import { 
  signUp, 
  getPendingUsers, 
  approveUser, 
  rejectUser,
  resetPassword,
  UserStatus,
  type PendingUser
} from './adminFunctions';

// Export the authService object with all functions
export const authService = {
  signOut,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  signUp,
  getPendingUsers,
  approveUser,
  rejectUser,
  loginWithEmailPassword,
  resetPassword
};

// Re-export types
export { UserStatus, type PendingUser };
