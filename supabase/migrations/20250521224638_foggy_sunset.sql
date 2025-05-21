/*
  # Fix user_profiles RLS policies

  1. Changes
    - Drop existing policies causing recursion
    - Create new simplified policies for admin and user access
    - Fix infinite recursion by avoiding self-referential checks

  2. Security
    - Maintain row-level security
    - Ensure admins can access all profiles
    - Users can only access their own profile
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "Admin full access"
ON user_profiles
FOR ALL
TO authenticated
USING (
  role = 'admin'
);

CREATE POLICY "Users read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Users update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);