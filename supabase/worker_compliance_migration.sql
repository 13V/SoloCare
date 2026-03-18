-- Worker Compliance Documents
create table if not exists worker_documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  document_type   text not null,
  document_name   text not null,
  expiry_date     date,
  issued_date     date,
  notes           text,
  status          text not null default 'current' check (status in ('current', 'expired', 'expiring_soon')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table worker_documents enable row level security;

create policy "Users manage own worker documents"
  on worker_documents for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Incident Mandatory Reporting Columns
alter table incidents add column if not exists is_reportable boolean not null default false;
alter table incidents add column if not exists reportable_type text check (reportable_type in ('immediate', 'non_immediate', null));
alter table incidents add column if not exists ndis_notified_at timestamptz;
alter table incidents add column if not exists notification_due_at timestamptz;
alter table incidents add column if not exists notification_outcome text;
alter table incidents add column if not exists notification_reference text;

-- Participant Goals
create table if not exists participant_goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  participant_id   uuid not null references participants(id) on delete cascade,
  goal_description text not null,
  category         text,
  target_date      date,
  status           text not null default 'active' check (status in ('active', 'achieved', 'discontinued')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table participant_goals enable row level security;

create policy "Users manage own goals"
  on participant_goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists participant_goals_participant_id_idx on participant_goals(participant_id);

-- Progress Notes — link to goals
alter table progress_notes add column if not exists goal_ids uuid[] default '{}';
