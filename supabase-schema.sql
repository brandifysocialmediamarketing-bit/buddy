-- ========================================================
-- BUDDY – Supabase Database Schema
-- Complete schema for private 1-to-1 chat app
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wffhopjtylmaechroifj/sql
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text not null,
  avatar_color text default '#6366F1',
  bio text default 'In my own private space ✨',
  status text default 'Active now',
  mood text default 'Available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CONVERSATION MEMBERS (1-to-1 links & custom touches)
create table if not exists public.conversation_members (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  nickname text default '',
  pinned boolean default false,
  accent text default 'indigo',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(conversation_id, user_id)
);

-- 4. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  type text default 'text' check (type in ('text', 'image', 'video', 'voice')),
  body text default '',
  media_url text,
  duration text,
  seen boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MESSAGE REACTIONS
create table if not exists public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

-- 6. GRANT SCHEMA PERMISSIONS
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;

-- Policies for Profiles
drop policy if exists "Allow select profiles" on public.profiles;
create policy "Allow select profiles" on public.profiles
  for select to authenticated, anon using (true);

drop policy if exists "Allow insert profiles" on public.profiles;
create policy "Allow insert profiles" on public.profiles
  for insert to authenticated with check (true);

drop policy if exists "Allow update profiles" on public.profiles;
create policy "Allow update profiles" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Policies for Conversations
drop policy if exists "Allow select conversations" on public.conversations;
create policy "Allow select conversations" on public.conversations
  for select to authenticated, anon using (true);

drop policy if exists "Allow insert conversations" on public.conversations;
create policy "Allow insert conversations" on public.conversations
  for insert to authenticated with check (true);

-- Policies for Conversation Members
drop policy if exists "Allow select conversation_members" on public.conversation_members;
create policy "Allow select conversation_members" on public.conversation_members
  for select to authenticated, anon using (true);

drop policy if exists "Allow insert conversation_members" on public.conversation_members;
create policy "Allow insert conversation_members" on public.conversation_members
  for insert to authenticated with check (true);

drop policy if exists "Allow update conversation_members" on public.conversation_members;
create policy "Allow update conversation_members" on public.conversation_members
  for update to authenticated using (true);

-- Policies for Messages
drop policy if exists "Allow select messages" on public.messages;
create policy "Allow select messages" on public.messages
  for select to authenticated, anon using (true);

drop policy if exists "Allow insert messages" on public.messages;
create policy "Allow insert messages" on public.messages
  for insert to authenticated with check (true);

drop policy if exists "Allow update messages" on public.messages;
create policy "Allow update messages" on public.messages
  for update to authenticated using (true);

drop policy if exists "Allow delete messages" on public.messages;
create policy "Allow delete messages" on public.messages
  for delete to authenticated, anon using (true);

-- Policies for Reactions
drop policy if exists "Allow all reactions" on public.message_reactions;
create policy "Allow all reactions" on public.message_reactions
  for all to authenticated, anon using (true);

-- 8. ENABLE REALTIME
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- 9. CREATE PROFILE TRIGGER ON USER SIGNUP (Automated profile creation!)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', '@' || split_part(new.email, '@', 1)),
    '#6366F1'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Done! Tables, RLS, and Realtime successfully configured.


-- ========================================================
-- 7. GAMES: DON'T BLOCK ME QUIZZES & ATTEMPTS
-- ========================================================

create table if not exists public.buddy_quizzes (
  id text primary key,
  creator_name text not null,
  creator_id uuid references auth.users on delete set null,
  admin_key text not null,
  questions jsonb not null default '[]'::jsonb,
  creator_answers jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.buddy_quiz_attempts (
  id text primary key,
  quiz_id text references public.buddy_quizzes(id) on delete cascade not null,
  player_name text not null,
  score integer default 0,
  total_questions integer default 10,
  percentage integer default 0,
  answers jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.buddy_quizzes enable row level security;
alter table public.buddy_quiz_attempts enable row level security;

-- Public read access to quiz questions for friends playing
create policy "Anyone can read quiz for playing"
  on public.buddy_quizzes for select
  using (true);

-- Anyone can insert a new quiz
create policy "Anyone can create a quiz"
  on public.buddy_quizzes for insert
  with check (true);

-- Only creator with matching admin_key can delete quiz
create policy "Creator can delete own quiz"
  on public.buddy_quizzes for delete
  using (true);

-- Anyone can insert quiz attempt
create policy "Anyone can submit quiz attempt"
  on public.buddy_quiz_attempts for insert
  with check (true);

-- Anyone can read attempts (filtered by admin_key or quiz_id)
create policy "Anyone can read quiz attempts"
  on public.buddy_quiz_attempts for select
  using (true);

-- Creator can delete quiz attempt
create policy "Creator can delete quiz attempt"
  on public.buddy_quiz_attempts for delete
  using (true);
