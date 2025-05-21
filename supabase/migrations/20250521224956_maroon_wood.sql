/*
  # Add admin user profile
  
  1. Changes
    - Add unique constraint on user_id
    - Insert admin user profile
  
  2. Security
    - Ensures only one profile per user
*/

-- First ensure user_id is unique
ALTER TABLE public.user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_key,
  ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- Then insert the admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'advisorconnectdev@gmail.com';

  -- Insert admin profile if user exists
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      user_id,
      first_name,
      last_name,
      status,
      role,
      created_at,
      updated_at
    )
    VALUES (
      admin_user_id,
      'Admin',
      'User',
      'APPROVED',
      'admin',
      now(),
      now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      status = 'APPROVED',
      role = 'admin',
      updated_at = now();
  END IF;
END $$;