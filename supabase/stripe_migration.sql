-- Add Stripe subscription fields to profiles
alter table profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text default null,
  add column if not exists subscription_period_end timestamptz default null;

-- Index for fast customer lookup from webhook
create index if not exists profiles_stripe_customer_id_idx on profiles(stripe_customer_id);
