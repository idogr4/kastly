-- Landing page analytics + leads capture
-- Run in Supabase SQL editor.

create table if not exists public.landing_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'click')),
  created_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

create index if not exists landing_events_campaign_idx
  on public.landing_events (campaign_id, event_type, created_at);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  note text,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create index if not exists leads_campaign_idx
  on public.leads (campaign_id, created_at desc);

-- RLS: public can INSERT events/leads for any campaign (anonymous tracking),
-- but only the owning user can SELECT.
alter table public.landing_events enable row level security;
alter table public.leads enable row level security;

drop policy if exists "anyone can insert landing events" on public.landing_events;
create policy "anyone can insert landing events"
  on public.landing_events for insert
  with check (true);

drop policy if exists "owner can read landing events" on public.landing_events;
create policy "owner can read landing events"
  on public.landing_events for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = landing_events.campaign_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "anyone can submit leads" on public.leads;
create policy "anyone can submit leads"
  on public.leads for insert
  with check (true);

drop policy if exists "owner can read leads" on public.leads;
create policy "owner can read leads"
  on public.leads for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = leads.campaign_id
        and c.user_id = auth.uid()
    )
  );
