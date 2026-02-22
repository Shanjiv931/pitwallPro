
-- NOTE: To fully disable email verification, disable "Confirm email" in Supabase Dashboard > Authentication > Providers > Email.

-- 1. Create Profiles Table (Stores user metadata and admin status)
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  password text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

alter table public.profiles enable row level security;

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

drop policy if exists "Users can delete own profile." on profiles;
create policy "Users can delete own profile."
  on profiles for delete
  using ( auth.uid() = id );

-- 3. Create Drivers Table
create table if not exists public.drivers (
  id text primary key,
  user_id uuid references auth.users(id),
  name text not null,
  team text not null,
  number int not null,
  color text,
  base_pace float not null,
  consistency float not null,
  tyre_management float not null,
  aggression float not null,
  wet_weather_ability float not null,
  assessment_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.drivers enable row level security;

-- 4. Drivers Policies
drop policy if exists "Drivers are viewable by everyone." on drivers;
create policy "Drivers are viewable by everyone."
  on drivers for select
  using ( true );

drop policy if exists "Authenticated users can insert drivers." on drivers;
create policy "Authenticated users can insert drivers."
  on drivers for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Users modify own, Admins modify all" on drivers;
create policy "Users modify own, Admins modify all"
  on drivers for update
  using ( 
    auth.uid() = user_id 
    OR 
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users delete own, Admins delete all" on drivers;
create policy "Users delete own, Admins delete all"
  on drivers for delete
  using ( 
    auth.uid() = user_id 
    OR 
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 5. Trigger for New User Creation (Automatically creates a profile AND auto-confirms email)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer -- Important: Allows function to access auth.users
as $$
begin
  -- 1. Create Profile
  insert into public.profiles (id, email, password, is_admin)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'password_copy', -- Extract password from metadata
    false
  )
  on conflict (id) do nothing;

  -- 2. Auto-confirm email to bypass verification step
  -- This updates the auth.users table directly to set the email as confirmed.
  update auth.users
  set email_confirmed_at = now()
  where id = new.id;
  
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Account Deletion RPC
-- Allows a user to delete their own account (Auth + Data)
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
as $$
declare
  requesting_user_id uuid;
begin
  requesting_user_id := auth.uid();
  
  if requesting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Delete Drivers (Explicit delete to prevent orphans if cascade missing)
  delete from public.drivers where user_id = requesting_user_id;

  -- 2. Delete Profile (Explicit delete)
  delete from public.profiles where id = requesting_user_id;

  -- 3. Delete Auth User (The big one)
  delete from auth.users where id = requesting_user_id;
end;
$$;

-- 6. SEED DATA
INSERT INTO public.drivers (id, user_id, name, team, number, color, base_pace, consistency, tyre_management, aggression, wet_weather_ability)
VALUES 
('ver', NULL, 'Max Verstappen', 'Red Bull Racing', 1, '#3671C6', 0.0, 0.98, 0.98, 0.95, 0.99),
('nor', NULL, 'Lando Norris', 'McLaren', 4, '#FF8000', 0.05, 0.95, 0.94, 0.85, 0.92),
('lec', NULL, 'Charles Leclerc', 'Ferrari', 16, '#E80020', 0.08, 0.94, 0.90, 0.90, 0.88),
('pia', NULL, 'Oscar Piastri', 'McLaren', 81, '#FF8000', 0.15, 0.93, 0.92, 0.80, 0.85),
('sai', NULL, 'Carlos Sainz', 'Ferrari', 55, '#E80020', 0.18, 0.95, 0.93, 0.88, 0.89),
('ham', NULL, 'Lewis Hamilton', 'Ferrari', 44, '#E80020', 0.12, 0.97, 0.99, 0.85, 0.98),
('rus', NULL, 'George Russell', 'Mercedes', 63, '#27F4D2', 0.20, 0.92, 0.90, 0.92, 0.87),
('alo', NULL, 'Fernando Alonso', 'Aston Martin', 14, '#229971', 0.35, 0.99, 0.98, 0.90, 0.93),
('alb', NULL, 'Alex Albon', 'Williams', 23, '#64C4FF', 0.60, 0.90, 0.85, 0.80, 0.85),
('tsu', NULL, 'Yuki Tsunoda', 'RB', 22, '#6692FF', 0.65, 0.85, 0.80, 0.88, 0.75)
ON CONFLICT (id) DO NOTHING;
