/*
  # Create advisors table and policies

  1. New Tables
    - `advisors`
      - `id` (uuid, primary key)
      - `first_name` (text, required)
      - `last_name` (text, required)
      - `team_name` (text)
      - `title` (text)
      - `firm` (text, required)
      - `branch` (text)
      - `city` (text)
      - `province` (text)
      - `email` (text)
      - `linkedin_url` (text)
      - `website_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `advisors` table
    - Add policy for authenticated users to read advisors
*/

-- Create advisors table if it doesn't exist
CREATE TABLE IF NOT EXISTS advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  team_name text,
  title text,
  firm text NOT NULL,
  branch text,
  city text,
  province text,
  email text,
  linkedin_url text,
  website_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'advisors' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists and recreate it
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Advisors are viewable by authenticated users" ON advisors;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'advisors' 
    AND policyname = 'Advisors are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Advisors are viewable by authenticated users"
      ON advisors
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;