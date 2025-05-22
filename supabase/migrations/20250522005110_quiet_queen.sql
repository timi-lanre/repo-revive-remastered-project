/*
  # Create Advisor Database Schema

  1. New Tables
    - `advisors`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `team_name` (text)
      - `title` (text)
      - `firm` (text)
      - `branch` (text)
      - `city` (text)
      - `province` (text)
      - `email` (text)
      - `linkedin_url` (text)
      - `website_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `news_updates`
      - `id` (uuid, primary key)
      - `content` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references user_profiles)
      - `updated_at` (timestamptz)

    - `favorites_lists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, references user_profiles)
      - `created_at` (timestamptz)

    - `favorite_advisors`
      - `list_id` (uuid, references favorites_lists)
      - `advisor_id` (uuid, references advisors)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
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

-- Create news_updates table
CREATE TABLE IF NOT EXISTS news_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id),
  updated_at timestamptz DEFAULT now()
);

-- Create favorites_lists table
CREATE TABLE IF NOT EXISTS favorites_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Create favorite_advisors table
CREATE TABLE IF NOT EXISTS favorite_advisors (
  list_id uuid REFERENCES favorites_lists(id) ON DELETE CASCADE,
  advisor_id uuid REFERENCES advisors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (list_id, advisor_id)
);

-- Enable RLS
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_advisors ENABLE ROW LEVEL SECURITY;

-- Policies for advisors
CREATE POLICY "Advisors are viewable by authenticated users"
  ON advisors
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for news_updates
CREATE POLICY "News updates are viewable by authenticated users"
  ON news_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "News updates can be created by admins"
  ON news_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies for favorites_lists
CREATE POLICY "Users can manage their own favorites lists"
  ON favorites_lists
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for favorite_advisors
CREATE POLICY "Users can manage their favorite advisors"
  ON favorite_advisors
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM favorites_lists
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM favorites_lists
      WHERE user_id = auth.uid()
    )
  );