-- Folio Resume Builder — Supabase PostgreSQL Schema & Row Level Security
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor).

create extension if not exists "pgcrypto";

-- 1. Profiles table (mirrors auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Automatically create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Templates catalog (publicly readable)
create table if not exists public.templates (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "Templates are publicly readable" on public.templates;
create policy "Templates are publicly readable"
  on public.templates for select
  using (is_active = true);

-- Seed all 13 templates
insert into public.templates (id, name, category, description, is_active) values
  ('europass', 'Europass CV', 'Professional', 'Official European CV style with a structured personal details block, date timeline and CEFR language table.', true),
  ('classic', 'Classic Professional', 'Professional', 'A timeless serif layout with a centered header and ruled sections.', true),
  ('modern-minimal', 'Modern Minimal', 'Minimal', 'Generous whitespace with section labels in a left gutter.', true),
  ('executive', 'Corporate Executive', 'Experienced Professional', 'A bold full-width header band and highlighted executive summary.', true),
  ('ats', 'ATS-Friendly Single Column', 'ATS-Friendly', 'Plain single column parsed cleanly by applicant tracking systems.', true),
  ('two-column', 'Modern Two Column', 'Modern', 'A colored sidebar for contact details and skills beside an experience column.', true),
  ('graduate', 'Graduate / Fresher', 'Fresher / Graduate', 'Puts education, projects and skills first for students and graduates.', true),
  ('creative', 'Creative Professional', 'Creative', 'Expressive display typography, monogram badge and vertical timeline.', true),
  ('elegant', 'Elegant Minimal', 'Minimal', 'Refined Garamond typography with hairline rules and letter-spaced headings.', true),
  ('technical', 'Technical / IT Professional', 'Modern', 'Monospace accents, skills sidebar with meters and prominent projects.', true),
  ('academic', 'Academic CV', 'Experienced Professional', 'Scholarly curriculum vitae with a date column and publications.', true),
  ('international', 'International Job Application', 'Professional', 'Europass-inspired structure with labelled details and CEFR language levels.', true),
  ('bw', 'Simple Black & White', 'Minimal', 'High-contrast monochrome with heavy type and print-ready clarity.', true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  is_active = excluded.is_active;

-- 3. Resumes table (strictly scoped to owner)
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_name text not null default 'Untitled Resume',
  template_id text not null references public.templates(id) default 'modern-minimal',
  resume_data jsonb not null default '{}'::jsonb,
  customization_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_updated_idx on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;

drop policy if exists "Users can view their own resumes" on public.resumes;
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own resumes" on public.resumes;
create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own resumes" on public.resumes;
create policy "Users can update their own resumes"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own resumes" on public.resumes;
create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Keep updated_at current automatically
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists resumes_touch_updated_at on public.resumes;
create trigger resumes_touch_updated_at
  before update on public.resumes
  for each row execute procedure public.touch_updated_at();

-- 4. Table-level privileges for Supabase anon / authenticated roles
grant usage on schema public to anon, authenticated;
grant select on public.templates to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.resumes to authenticated;
