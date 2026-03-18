-- Migration: Invoices + Participant Budgets

-- INVOICES TABLE
create table if not exists invoices (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  participant_id   uuid not null references participants(id) on delete cascade,
  invoice_number   text not null,
  issue_date       date not null,
  due_date         date not null,
  status           text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  gst_registered   boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, invoice_number)
);

alter table invoices enable row level security;

create policy "Users manage own invoices"
  on invoices for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- INVOICE LINE ITEMS TABLE
create table if not exists invoice_line_items (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references invoices(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  sort_order       integer not null default 0,
  description      text not null,
  support_category text,
  hours            numeric(8,2) not null default 0,
  rate             numeric(8,2) not null default 0,
  amount           numeric(10,2) not null default 0
);

alter table invoice_line_items enable row level security;

create policy "Users manage own line items"
  on invoice_line_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-update updated_at
create or replace function update_invoice_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger invoices_updated_at
  before update on invoices
  for each row execute procedure update_invoice_updated_at();

-- Per-user invoice number generator
create or replace function next_invoice_number(p_user_id uuid)
returns text as $$
declare
  v_next int;
begin
  select coalesce(max((regexp_match(invoice_number, '\d+$'))[1]::int), 1000) + 1
  into v_next
  from invoices
  where user_id = p_user_id;
  return 'INV-' || v_next::text;
end;
$$ language plpgsql security definer;

-- PARTICIPANT BUDGETS TABLE
create table if not exists participant_budgets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  participant_id    uuid not null references participants(id) on delete cascade,
  support_category  text not null,
  total_budget      numeric(10,2) not null default 0,
  amount_spent      numeric(10,2) not null default 0,
  plan_start_date   date,
  plan_end_date     date,
  warning_threshold integer not null default 20 check (warning_threshold between 1 and 100),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (participant_id, support_category)
);

alter table participant_budgets enable row level security;

create policy "Users manage own budgets"
  on participant_budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function update_budget_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger participant_budgets_updated_at
  before update on participant_budgets
  for each row execute procedure update_budget_updated_at();

-- Indexes
create index if not exists invoices_user_id_status_idx on invoices(user_id, status);
create index if not exists invoices_participant_id_idx on invoices(participant_id);
create index if not exists invoice_line_items_invoice_id_idx on invoice_line_items(invoice_id);
create index if not exists participant_budgets_participant_id_idx on participant_budgets(participant_id);
