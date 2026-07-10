-- ============================================================
-- LifeAdmin Supabase Schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- Profiles table: extends Supabase's built-in auth.users with app-specific data
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  avatar_initials text default 'ME',
  plan text default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive',
  billing_interval text, -- 'month' or 'year'
  created_at timestamp with time zone default now()
);

-- Documents table: replaces the hardcoded demo document list
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  sub_label text,
  expires_on date,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- Family members table
create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  relationship text,
  created_at timestamp with time zone default now()
);

-- Row Level Security: users can only see/edit their own data
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.family_members enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own documents" on public.documents
  for select using (auth.uid() = owner_id);
create policy "Users can insert own documents" on public.documents
  for insert with check (auth.uid() = owner_id);
create policy "Users can update own documents" on public.documents
  for update using (auth.uid() = owner_id);
create policy "Users can delete own documents" on public.documents
  for delete using (auth.uid() = owner_id);

create policy "Users can view own family members" on public.family_members
  for select using (auth.uid() = owner_id);
create policy "Users can insert own family members" on public.family_members
  for insert with check (auth.uid() = owner_id);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'New User'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LEFTOVERS tables
-- ============================================================
create table if not exists public.pantry_items (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text,
  quantity text,
  expires_on date,
  status text default 'fresh',
  created_at timestamp with time zone default now()
);
alter table public.pantry_items enable row level security;
create policy "Users manage own pantry items" on public.pantry_items
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- PROVIDERS table (shared: Neighborhood Helper + Roadside Warriors)
-- Tracks the Stripe Connect account used to pay providers out
-- ============================================================
create table if not exists public.providers (
  id uuid references public.profiles(id) on delete cascade primary key,
  app text not null check (app in ('neighborhood-helper', 'roadside-warriors')),
  stripe_connect_account_id text,
  onboarding_complete boolean default false,
  verified boolean default false,
  rating numeric default 5.0,
  created_at timestamp with time zone default now()
);
alter table public.providers enable row level security;
create policy "Users manage own provider profile" on public.providers
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- NEIGHBORHOOD HELPER tables
-- ============================================================
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  poster_id uuid references public.profiles(id) on delete cascade not null,
  accepted_by uuid references public.profiles(id),
  title text not null,
  category text,
  description text,
  price_type text check (price_type in ('fixed', 'tip')),
  price numeric,
  urgent boolean default false,
  status text default 'open' check (status in ('open', 'accepted', 'completed', 'cancelled')),
  stripe_payment_intent_id text,
  provider_paid_out boolean default false,
  stripe_provider_transfer_id text,
  created_at timestamp with time zone default now()
);
alter table public.tasks enable row level security;
create policy "Anyone can view open tasks" on public.tasks for select using (true);
create policy "Users can post tasks" on public.tasks
  for insert with check (auth.uid() = poster_id);
create policy "Poster or accepter can update a task" on public.tasks
  for update using (auth.uid() = poster_id or auth.uid() = accepted_by);

-- ============================================================
-- AUTO CARE tables
-- ============================================================
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  service_name text not null,
  price numeric not null,
  scheduled_date date,
  scheduled_time text,
  address text,
  status text default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  stripe_payment_intent_id text,
  created_at timestamp with time zone default now()
);
alter table public.bookings enable row level security;
create policy "Users manage own bookings" on public.bookings
  for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

-- ============================================================
-- ROADSIDE WARRIORS tables
-- ============================================================
create table if not exists public.roadside_requests (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  provider_id uuid references public.profiles(id),
  service_name text not null,
  dispatch_fee numeric default 50,
  service_charge numeric,
  dispatch_paid boolean default false,
  service_paid boolean default false,
  provider_paid_out boolean default false,
  status text default 'requested' check (status in ('requested', 'matched', 'en_route', 'arrived', 'completed', 'cancelled')),
  location text,
  stripe_dispatch_payment_intent_id text,
  stripe_service_payment_intent_id text,
  stripe_provider_transfer_id text,
  created_at timestamp with time zone default now()
);
alter table public.roadside_requests enable row level security;
create policy "Customer or provider can view a request" on public.roadside_requests
  for select using (auth.uid() = customer_id or auth.uid() = provider_id);
create policy "Users can create requests" on public.roadside_requests
  for insert with check (auth.uid() = customer_id);
create policy "Customer or provider can update a request" on public.roadside_requests
  for update using (auth.uid() = customer_id or auth.uid() = provider_id);
