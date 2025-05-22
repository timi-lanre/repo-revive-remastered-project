
import { loginWithEmailPassword, signOut } from './authFunctions';
import { getCurrentUser, isAuthenticated, isAdmin } from './userFunctions';
import { 
  getPendingUsers, 
  approveUser, 
  rejectUser,
  resetPassword,
  createUser,
  UserStatus,
  type PendingUser
} from './adminFunctions';

// Export the authService object with all functions
export const authService = {
  signOut,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  getPendingUsers,
  approveUser,
  rejectUser,
  loginWithEmailPassword,
  resetPassword,
  createUser
};

// Re-export types
export { UserStatus, type PendingUser };
