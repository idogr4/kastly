-- Subscriptions table — tracks Paddle subscription state per user
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan text not null default 'free' check (plan in ('free', 'basic', 'pro', 'business')),
  paddle_customer_id text,
  paddle_subscription_id text,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- Update campaigns table — add gallery support and plan tracking
alter table public.campaigns
  add column if not exists is_public boolean default false,
  add column if not exists industry text,
  add column if not exists preview_image_url text,
  add column if not exists campaign_data jsonb,
  add column if not exists plan text default 'free';

-- Index for gallery queries
create index if not exists idx_campaigns_public on public.campaigns (is_public, created_at desc)
  where is_public = true;

-- Public gallery policy — anyone can read public campaigns
create policy "Anyone can read public campaigns"
  on public.campaigns for select
  using (is_public = true);

-- Usage tracking — count campaigns per user per month
create or replace function public.get_monthly_campaign_count(p_user_id uuid)
returns integer as $$
  select count(*)::integer
  from public.campaigns
  where user_id = p_user_id
    and created_at >= date_trunc('month', now())
    and created_at < date_trunc('month', now()) + interval '1 month';
$$ language sql security definer;
