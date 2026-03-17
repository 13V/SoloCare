-- Participants
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  first_name text not null,
  last_name text,
  ndis_number text,
  date_of_birth date,
  plan_start_date date,
  plan_end_date date,
  funding_type text check (funding_type in ('self_managed', 'plan_managed', 'agency_managed')),
  support_categories text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table participants enable row level security;
create policy "Users see own participants" on participants for all using (user_id = auth.uid());

-- Progress Notes
create table if not exists progress_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  session_date date not null,
  session_start time,
  session_end time,
  support_category text,
  goals_worked text,
  what_happened text not null,
  participant_response text,
  follow_up text,
  created_at timestamptz default now()
);

alter table progress_notes enable row level security;
create policy "Users see own notes" on progress_notes for all using (user_id = auth.uid());

-- Shifts
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  support_category text,
  hourly_rate numeric(8,2),
  notes text,
  invoiced boolean default false,
  created_at timestamptz default now()
);

alter table shifts enable row level security;
create policy "Users see own shifts" on shifts for all using (user_id = auth.uid());

-- Service Agreements
create table if not exists service_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  content text,
  start_date date,
  end_date date,
  generated_at timestamptz default now(),
  last_updated_at timestamptz default now()
);

alter table service_agreements enable row level security;
create policy "Users see own agreements" on service_agreements for all using (user_id = auth.uid());

-- Registration checklist progress (stored on profiles)
alter table profiles add column if not exists registration_checklist jsonb default '{}';
