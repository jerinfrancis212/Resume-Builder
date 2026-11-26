-- Folio Resume Builder — Migration 002: Razorpay Payments, Entitlements & Analytics
-- Run this in Supabase Dashboard → SQL Editor → New Query.

-- 1. Add server-controlled entitlement columns to resumes
alter table public.resumes
  add column if not exists is_paid boolean not null default false,
  add column if not exists paid_at timestamptz;

-- Prevent clients (authenticated / anon roles) from forging is_paid or paid_at directly.
-- Only backend calls using SUPABASE_SERVICE_ROLE_KEY can unlock or revoke payment entitlements.
create or replace function public.protect_resume_entitlement()
returns trigger
language plpgsql
as $$
begin
  if current_setting('request.jwt.claim.role', true) in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_paid := false;
      new.paid_at := null;
    elsif tg_op = 'UPDATE' then
      if (
        new.template_id is distinct from old.template_id
        or new.resume_data is distinct from old.resume_data
        or new.customization_data is distinct from old.customization_data
      ) then
        new.is_paid := false;
        new.paid_at := null;
      else
        new.is_paid := old.is_paid;
        new.paid_at := old.paid_at;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists resumes_protect_entitlement on public.resumes;
create trigger resumes_protect_entitlement
  before insert or update on public.resumes
  for each row execute procedure public.protect_resume_entitlement();

-- 2. Payments table (strictly written by backend service_role; users can only read their own)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount integer not null check (amount = 4900),
  currency text not null default 'INR' check (currency = 'INR'),
  payment_status text not null default 'created'
    check (payment_status in ('created', 'pending', 'successful', 'failed', 'refunded')),
  failure_reason text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists payments_user_created_idx on public.payments (user_id, created_at desc);
create index if not exists payments_resume_status_idx on public.payments (resume_id, payment_status);

alter table public.payments enable row level security;

drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Revoke all client-side write access on payments; only service_role may insert/update/delete
revoke insert, update, delete on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- 3. Idempotent webhook event log (service_role only)
create table if not exists public.payment_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from anon, authenticated;

-- 4. Funnel & payment analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can insert their own analytics events" on public.analytics_events;
create policy "Anyone can insert their own analytics events"
  on public.analytics_events for insert
  with check (user_id is null or auth.uid() = user_id);

grant insert on public.analytics_events to anon, authenticated;
revoke select, update, delete on public.analytics_events from anon, authenticated;

-- 5. Admin payment summary view (accessible via Supabase SQL Editor / service_role)
create or replace view public.admin_payment_summary as
select
  count(p.id) as total_payments,
  coalesce(sum(case when p.payment_status = 'successful' then p.amount else 0 end) / 100.0, 0) as total_revenue_inr,
  count(case when p.payment_status = 'successful' then 1 end) as successful_transactions,
  count(case when p.payment_status = 'failed' then 1 end) as failed_transactions,
  (select count(*) from public.resumes) as total_resumes_created,
  case
    when (select count(*) from public.resumes) > 0
      then round(
        (count(distinct case when p.payment_status = 'successful' then p.resume_id end)::numeric
          / (select count(*) from public.resumes)::numeric) * 100,
        2
      )
    else 0
  end as conversion_rate_percent
from public.payments p;

revoke all on public.admin_payment_summary from anon, authenticated;

-- 6. Explicit privileges for Supabase service_role (required for sb_secret_ keys)
grant usage on schema public to service_role;
grant all on public.resumes to service_role;
grant all on public.payments to service_role;
grant all on public.payment_webhook_events to service_role;
grant all on public.analytics_events to service_role;
grant select on public.admin_payment_summary to service_role;
