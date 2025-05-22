/*
  # Create advisors table and related tables

  1. New Tables
    - advisors: Main table for storing advisor information
      - id (uuid, primary key)
      - first_name (text, required)
      - last_name (text, required)
      - team_name (text)
      - title (text)
      - firm (text, required)
      - branch (text)
      - city (text)
      - province (text)
      - email (text)
      - linkedin_url (text)
      - website_url (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on advisors table
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

-- Enable RLS
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

-- Create policy for reading advisors
CREATE POLICY "Advisors are viewable by authenticated users"
  ON advisors
  FOR SELECT
  TO authenticated
  USING (true);