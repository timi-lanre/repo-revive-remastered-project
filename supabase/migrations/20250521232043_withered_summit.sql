/*
  # Delete Test User

  1. Changes
    - Delete user from auth.users table
    - Delete user from public.user_profiles table if it exists
*/

-- Delete from user_profiles if exists
DO $$ 
BEGIN
  DELETE FROM public.user_profiles
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'timilanre@gmail.com'
  );
END $$;

-- Delete from auth.users
DELETE FROM auth.users 
WHERE email = 'timilanre@gmail.com';