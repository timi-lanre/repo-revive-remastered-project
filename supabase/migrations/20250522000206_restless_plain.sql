-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_email_on_insert ON user_profiles;
DROP FUNCTION IF EXISTS sync_user_email();

-- Create improved sync function that handles both insert and update
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users
  NEW.email := (
    SELECT email 
    FROM auth.users 
    WHERE id = NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER sync_email_on_change
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Update all existing profiles with emails
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
AND (up.email IS NULL OR up.email != au.email);