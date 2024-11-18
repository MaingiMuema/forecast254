-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    first_name text,
    last_name text,
    phone text unique,
    avatar_url text,
    balance decimal(10,2) default 0.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create markets table
create table if not exists public.markets (
    id uuid default uuid_generate_v4() primary key,
    creator_id uuid references public.profiles(id) on delete set null,
    title text not null,
    description text,
    category text not null,
    resolution_source text,
    closing_date timestamp with time zone not null,
    resolution_date timestamp with time zone not null,
    status text default 'open' check (status in ('open', 'closed', 'resolved', 'cancelled')),
    outcome text,
    total_volume decimal(15,2) default 0.0,
    liquidity_pool decimal(15,2) default 0.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create positions table
create table if not exists public.positions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    market_id uuid references public.markets(id) on delete cascade,
    position_type text not null check (position_type in ('yes', 'no')),
    shares decimal(15,2) not null default 0.0,
    average_price decimal(10,4) not null,
    realized_pnl decimal(15,2) default 0.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, market_id, position_type)
);

-- Create transactions table
create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    market_id uuid references public.markets(id) on delete set null,
    transaction_type text not null check (transaction_type in ('deposit', 'withdrawal', 'trade', 'settlement')),
    amount decimal(15,2) not null,
    shares decimal(15,2),
    price decimal(10,4),
    position_type text check (position_type in ('yes', 'no')),
    mpesa_reference text,
    status text default 'pending' check (status in ('pending', 'completed', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create market_comments table
create table if not exists public.market_comments (
    id uuid default uuid_generate_v4() primary key,
    market_id uuid references public.markets(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create leaderboard_stats table
create table if not exists public.leaderboard_stats (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade unique,
    total_trades integer default 0,
    successful_predictions integer default 0,
    total_volume decimal(15,2) default 0.0,
    profit_loss decimal(15,2) default 0.0,
    win_rate decimal(5,2) default 0.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies

-- Profiles policies
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update using (auth.uid() = id);

-- Markets policies
alter table public.markets enable row level security;

create policy "Markets are viewable by everyone"
on public.markets for select
using (true);

create policy "Authenticated users can create markets"
on public.markets for insert
with check (auth.role() = 'authenticated');

create policy "Market creators can update their markets"
on public.markets for update
using (auth.uid() = creator_id);

-- Positions policies
alter table public.positions enable row level security;

create policy "Users can view their own positions"
on public.positions for select
using (auth.uid() = user_id);

create policy "Users can insert their own positions"
on public.positions for insert
with check (auth.uid() = user_id);

create policy "Users can update their own positions"
on public.positions for update
using (auth.uid() = user_id);

-- Transactions policies
alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
on public.transactions for select
using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
on public.transactions for insert
with check (auth.uid() = user_id);

-- Market comments policies
alter table public.market_comments enable row level security;

create policy "Comments are viewable by everyone"
on public.market_comments for select
using (true);

create policy "Authenticated users can create comments"
on public.market_comments for insert
with check (auth.role() = 'authenticated');

create policy "Users can update own comments"
on public.market_comments for update
using (auth.uid() = user_id);

-- Leaderboard stats policies
alter table public.leaderboard_stats enable row level security;

create policy "Leaderboard stats are viewable by everyone"
on public.leaderboard_stats for select
using (true);

-- Functions and triggers

-- Update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create updated_at triggers for all tables
create trigger handle_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.markets
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.positions
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.market_comments
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.leaderboard_stats
    for each row
    execute function public.handle_updated_at();
