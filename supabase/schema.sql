-- ============================================================
-- SoloCare Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- PROFILES TABLE
create table if not exists profiles (
  id uuid references auth.users primary key,
  business_name text,
  abn text,
  contact_name text,
  phone text,
  state text,
  created_at timestamptz default now(),
  onboarding_complete boolean default false
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());


-- VAULT DOCUMENTS TABLE
create table if not exists vault_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  document_type text check (document_type in ('worker_screening', 'police_check', 'first_aid', 'insurance', 'custom')),
  document_name text not null,
  file_url text,
  expiry_date date,
  uploaded_at timestamptz default now()
);

alter table vault_documents enable row level security;

create policy "Users can manage own documents"
  on vault_documents for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- POLICIES TABLE
create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  policy_type text check (policy_type in ('incident_management', 'complaints', 'risk', 'code_of_conduct')),
  content text not null,
  generated_at timestamptz default now(),
  last_reviewed_at timestamptz,
  unique(user_id, policy_type)
);

alter table policies enable row level security;

create policy "Users can manage own policies"
  on policies for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- INCIDENTS TABLE
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  participant_first_name text not null,
  incident_date date not null,
  incident_time time not null,
  location text not null,
  incident_type text check (incident_type in ('injury', 'near_miss', 'abuse', 'neglect', 'medication_error', 'other')),
  description text not null,
  immediate_action text not null,
  reported_to_ndis boolean default false,
  ndis_report_date date,
  created_at timestamptz default now()
);

alter table incidents enable row level security;

create policy "Users can manage own incidents"
  on incidents for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- STORAGE BUCKET for vault documents
-- Run this in Supabase Dashboard > Storage, or use the API:
-- insert into storage.buckets (id, name, public) values ('vault', 'vault', true);

-- Storage RLS policies (run after creating the bucket)
-- create policy "Users can upload to own folder"
--   on storage.objects for insert
--   with check (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Users can view own files"
--   on storage.objects for select
--   using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Users can delete own files"
--   on storage.objects for delete
--   using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);


-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
