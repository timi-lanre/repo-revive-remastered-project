/*
  # Add email field to user_profiles table

  1. Changes
    - Add email column to user_profiles table
    - Update RLS policies to allow admin access
    - Create trigger to sync email from auth.users
*/

-- Add email column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email on insert
DROP TRIGGER IF EXISTS sync_email_on_insert ON user_profiles;
CREATE TRIGGER sync_email_on_insert
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Update existing profiles with emails
DO $$
BEGIN
  UPDATE user_profiles
  SET email = users.email
  FROM auth.users
  WHERE user_profiles.user_id = users.id
  AND user_profiles.email IS NULL;
END $$;