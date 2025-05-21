/*
  # Add role column to user_profiles table

  1. Changes
    - Add role column to user_profiles table
    - Add check constraint to ensure valid roles
    - Update RLS policies to use role column for admin checks
*/

-- Add role column with check constraint
alter table public.user_profiles 
add column role text check (role in ('user', 'admin')) default 'user';

-- Update existing RLS policies to use role column
drop policy if exists "Admins can read all profiles" on public.user_profiles;
create policy "Admins can read all profiles"
  on public.user_profiles
  for select
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

drop policy if exists "Admins can update all profiles" on public.user_profiles;
create policy "Admins can update all profiles"
  on public.user_profiles
  for update
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );