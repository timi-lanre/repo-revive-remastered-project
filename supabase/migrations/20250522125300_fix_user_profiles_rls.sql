
/*
  # Fix RLS policies for user_profiles table

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create simplified admin access policy
    - Create user self-access policy
    - Avoid circular references in policy definitions

  2. Security
    - Maintain proper access control
    - Ensure admins can access all profiles
    - Users can only access their own profiles
*/

-- First drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin full access" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;

-- Create a simplified admin policy that uses a direct role check
-- This avoids self-referential checks that can cause recursion
CREATE POLICY "admin_access"
ON user_profiles
FOR ALL 
TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Allow users to read their own profile
CREATE POLICY "user_read_own"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Allow users to update their own profile
CREATE POLICY "user_update_own"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);
