
import { initializeOidcClient } from './oidcClient';
import { initiateLogin, handleCallback, signOut, loginWithEmailPassword } from './authFunctions';
import { getCurrentUser, isAuthenticated, isAdmin } from './userFunctions';
import { 
  signUp, 
  getPendingUsers, 
  approveUser, 
  rejectUser,
  UserStatus,
  type PendingUser
} from './adminFunctions';

// Make sure we initialize the client when this module is loaded
initializeOidcClient().catch(console.error);

// Export the authService object with all functions
export const authService = {
  initiateLogin,
  handleCallback,
  signOut,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  signUp,
  getPendingUsers,
  approveUser,
  rejectUser,
  loginWithEmailPassword
};

// Re-export types
export { UserStatus, type PendingUser };
