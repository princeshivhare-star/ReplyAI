create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reply_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  keyword text not null check (char_length(trim(keyword)) between 1 and 120),
  match_type text not null default 'contains' check (match_type in ('contains', 'exact', 'startsWith')),
  reply_message text not null check (char_length(trim(reply_message)) between 1 and 2000),
  platform text not null default 'both' check (platform in ('both', 'instagram', 'facebook')),
  active boolean not null default true,
  trigger_count bigint not null default 0 check (trigger_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reply_rules_user_active_idx
  on public.reply_rules (user_id, active);

create table if not exists public.brand_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  brand_name text not null default '',
  brand_voice text not null default 'Friendly, concise, and helpful',
  product_context text not null default '',
  ai_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('instagram', 'facebook')),
  external_account_id text not null,
  page_id text,
  account_name text not null default '',
  username text not null default '',
  access_token text not null,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  unique (provider, external_account_id)
);

create index if not exists social_accounts_user_provider_idx
  on public.social_accounts (user_id, provider);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_event_created bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_hash text not null unique,
  provider text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  attempts integer not null default 0,
  last_error text,
  received_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz
);

create index if not exists webhook_events_pending_idx
  on public.webhook_events (received_at)
  where status = 'pending';

create table if not exists public.reply_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  social_account_id uuid references public.social_accounts (id) on delete set null,
  platform text not null check (platform in ('instagram', 'facebook')),
  external_event_id text not null,
  matched_rule_id uuid references public.reply_rules (id) on delete set null,
  status text not null check (status in ('processing', 'sent', 'failed', 'skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, platform, external_event_id)
);

create table if not exists public.ai_usage_monthly (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_month date not null default (date_trunc('month', now() at time zone 'utc'))::date,
  generations integer not null default 0 check (generations >= 0),
  primary key (user_id, usage_month)
);

create index if not exists reply_logs_user_created_idx
  on public.reply_logs (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger reply_rules_set_updated_at
  before update on public.reply_rules
  for each row execute function public.set_updated_at();
create trigger brand_profiles_set_updated_at
  before update on public.brand_profiles
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.brand_profiles (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.reply_rules enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.oauth_states enable row level security;
alter table public.webhook_events enable row level security;
alter table public.reply_logs enable row level security;
alter table public.ai_usage_monthly enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage their own rules"
  on public.reply_rules for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read their own brand profile"
  on public.brand_profiles for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can update their own brand profile"
  on public.brand_profiles for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can edit their own brand profile"
  on public.brand_profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read their own reply history"
  on public.reply_logs for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.claim_webhook_events(batch_size integer default 20)
returns setof public.webhook_events
language sql
security definer
set search_path = public
as $$
  update public.webhook_events as event
     set status = 'processing',
         attempts = event.attempts + 1,
         processing_started_at = now()
   where event.id in (
     select id
       from public.webhook_events
      where status = 'pending'
         or (status = 'processing' and processing_started_at < now() - interval '5 minutes')
      order by received_at
      for update skip locked
      limit greatest(1, least(batch_size, 100))
   )
  returning event.*;
$$;

create or replace function public.consume_ai_generation(target_user_id uuid, monthly_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  consumed integer;
begin
  insert into public.ai_usage_daily (user_id, usage_date, generations)
  values (target_user_id, (date_trunc('month', now() at time zone 'utc'))::date, 1)
  on conflict (user_id, usage_month) do update
     set generations = ai_usage_monthly.generations + 1
   where ai_usage_monthly.generations < monthly_limit
  returning generations into consumed;

  return consumed is not null;
end;
$$;

create or replace function public.create_reply_rule(
  target_user_id uuid,
  rule_limit integer,
  rule_keyword text,
  rule_match_type text,
  rule_reply_message text,
  rule_platform text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_rules integer;
  created_rule public.reply_rules;
begin
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text, 0));
  select count(*) into existing_rules
    from public.reply_rules
   where user_id = target_user_id;

  if rule_limit is not null and existing_rules >= rule_limit then
    raise exception 'rule_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.reply_rules (user_id, keyword, match_type, reply_message, platform)
  values (target_user_id, rule_keyword, rule_match_type, rule_reply_message, rule_platform)
  returning * into created_rule;

  return to_jsonb(created_rule);
end;
$$;

create or replace function public.reserve_reply(
  target_user_id uuid,
  target_social_account_id uuid,
  target_platform text,
  target_external_event_id text,
  target_rule_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved_id uuid;
begin
  insert into public.reply_logs (
    user_id,
    social_account_id,
    platform,
    external_event_id,
    matched_rule_id,
    status
  )
  values (
    target_user_id,
    target_social_account_id,
    target_platform,
    target_external_event_id,
    target_rule_id,
    'processing'
  )
  on conflict (user_id, platform, external_event_id) do update
     set matched_rule_id = excluded.matched_rule_id,
         status = 'processing',
         created_at = now()
   where public.reply_logs.status = 'failed'
      or (public.reply_logs.status = 'processing' and public.reply_logs.created_at < now() - interval '5 minutes')
  returning id into reserved_id;

  return reserved_id;
end;
$$;

create or replace function public.increment_rule_trigger(target_rule_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.reply_rules
     set trigger_count = trigger_count + 1,
         updated_at = now()
   where id = target_rule_id;
$$;

create or replace function public.sync_stripe_subscription(
  target_user_id uuid,
  target_customer_id text,
  target_subscription_id text,
  target_price_id text,
  target_status text,
  target_period_end timestamptz,
  target_cancel_at_period_end boolean,
  target_event_created bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_end,
    cancel_at_period_end,
    stripe_event_created,
    updated_at
  )
  values (
    target_user_id,
    target_customer_id,
    target_subscription_id,
    target_price_id,
    target_status,
    target_period_end,
    target_cancel_at_period_end,
    target_event_created,
    now()
  )
  on conflict (user_id) do update
     set stripe_customer_id = excluded.stripe_customer_id,
         stripe_subscription_id = excluded.stripe_subscription_id,
         stripe_price_id = excluded.stripe_price_id,
         status = excluded.status,
         current_period_end = excluded.current_period_end,
         cancel_at_period_end = excluded.cancel_at_period_end,
         stripe_event_created = excluded.stripe_event_created,
         updated_at = now()
   where public.subscriptions.stripe_event_created <= excluded.stripe_event_created;
$$;

revoke all on function public.claim_webhook_events(integer) from public, anon, authenticated;
grant execute on function public.claim_webhook_events(integer) to service_role;
revoke all on function public.consume_ai_generation(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_generation(uuid, integer) to service_role;
revoke all on function public.create_reply_rule(uuid, integer, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_reply_rule(uuid, integer, text, text, text, text) to service_role;
revoke all on function public.reserve_reply(uuid, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_reply(uuid, uuid, text, text, uuid) to service_role;
revoke all on function public.increment_rule_trigger(uuid) from public, anon, authenticated;
grant execute on function public.increment_rule_trigger(uuid) to service_role;
revoke all on function public.sync_stripe_subscription(uuid, text, text, text, text, timestamptz, boolean, bigint) from public, anon, authenticated;
grant execute on function public.sync_stripe_subscription(uuid, text, text, text, text, timestamptz, boolean, bigint) to service_role;
