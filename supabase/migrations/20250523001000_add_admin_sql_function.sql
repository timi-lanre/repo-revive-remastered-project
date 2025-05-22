
/*
  # Add SQL function to bypass RLS for admin queries
  
  1. Changes
    - Create SQL function for admin to get all profiles
    - This function will run with security definer, bypassing RLS
  
  2. Security
    - Function checks if the user has admin role before returning data
    - Only returns data if the user is an admin
*/

-- Create a function that bypasses RLS for admin users
CREATE OR REPLACE FUNCTION get_all_profiles_for_admin()
RETURNS SETOF user_profiles
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if current user has admin role
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  -- Only return data if user is admin
  IF is_admin THEN
    RETURN QUERY SELECT * FROM user_profiles ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_profiles_for_admin() TO authenticated;
