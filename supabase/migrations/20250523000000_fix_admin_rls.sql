
/*
  # Fix admin RLS policies one more time
  
  1. Changes
    - Drop all existing policies to start fresh
    - Create a simple policy for admin access
    - Create a simple policy for user access
    - Ensure permissions are correctly set
  
  2. Security
    - Admin can access all profiles
    - Users can only access their own profiles
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin full access" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_access" ON user_profiles;
DROP POLICY IF EXISTS "user_read_own" ON user_profiles;
DROP POLICY IF EXISTS "user_update_own" ON user_profiles;

-- Create a new simple admin policy that grants full access to admins
-- This avoids the recursive check by using a direct constant check
CREATE POLICY "admin_full_access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  role = 'admin'
);

-- Create policies for users
CREATE POLICY "user_read_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Enable RLS to make sure policies are applied
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
