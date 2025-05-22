/*
  # Create advisors table and indexes

  1. New Tables
    - `advisors`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `team_name` (text)
      - `title` (text)
      - `firm` (text, not null)
      - `branch` (text)
      - `city` (text)
      - `province` (text)
      - `email` (text)
      - `linkedin_url` (text)
      - `website_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - `advisors_firm_idx` on firm
    - `advisors_province_idx` on province
    - `advisors_city_idx` on city
    - `advisors_name_idx` on first_name, last_name

  3. Security
    - Enable RLS
    - Add policy for authenticated users to read advisors
*/

-- Create advisors table
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

-- Create indexes for common search fields
CREATE INDEX IF NOT EXISTS advisors_firm_idx ON advisors (firm);
CREATE INDEX IF NOT EXISTS advisors_province_idx ON advisors (province);
CREATE INDEX IF NOT EXISTS advisors_city_idx ON advisors (city);
CREATE INDEX IF NOT EXISTS advisors_name_idx ON advisors (first_name, last_name);

-- Enable RLS
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

-- Create policy for reading advisors
DO $$ 
BEGIN
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