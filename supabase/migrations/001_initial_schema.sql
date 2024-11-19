-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    email text unique not null,
    avatar_url text,
    balance double precision default 1000.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create news_articles table
create table if not exists public.news_articles (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    content text not null,
    url text unique not null,
    category text not null,
    published_at timestamp with time zone not null,
    source text not null,
    author text,
    description text,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create markets table
create table if not exists public.markets (
    id uuid default uuid_generate_v4() primary key,
    creator_id uuid references public.profiles(id) not null,
    question text not null,
    description text not null,
    category text not null,
    resolved_value double precision,
    start_date timestamp with time zone default timezone('utc'::text, now()) not null,
    end_date timestamp with time zone not null,
    status text default 'open',
    source_article_id uuid references public.news_articles(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key relationship
alter table public.markets
    add constraint markets_source_article_id_fkey
    foreign key (source_article_id)
    references public.news_articles(id)
    on delete set null;

-- Create positions table
create table if not exists public.positions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    market_id uuid references public.markets(id) not null,
    shares double precision not null,
    avg_price double precision not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, market_id)
);

-- Create transactions table
create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    market_id uuid references public.markets(id) not null,
    type text not null,
    shares double precision not null,
    price double precision not null,
    total double precision not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create market_comments table
create table if not exists public.market_comments (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    market_id uuid references public.markets(id) not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create leaderboard_stats table
create table if not exists public.leaderboard_stats (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) unique not null,
    total_profit double precision default 0.0,
    win_rate double precision default 0.0,
    rank integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at triggers for relevant tables
create trigger handle_updated_at_profiles
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_markets
    before update on public.markets
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_positions
    before update on public.positions
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_leaderboard_stats
    before update on public.leaderboard_stats
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at_news_articles
    before update on public.news_articles
    for each row
    execute function public.handle_updated_at();

-- Create indexes for better query performance
create index if not exists idx_markets_category on public.markets(category);
create index if not exists idx_markets_status on public.markets(status);
create index if not exists idx_positions_user_id on public.positions(user_id);
create index if not exists idx_positions_market_id on public.positions(market_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_market_id on public.transactions(market_id);
create index if not exists idx_market_comments_market_id on public.market_comments(market_id);
create index if not exists idx_news_articles_category on public.news_articles(category);
create index if not exists idx_news_articles_published_at on public.news_articles(published_at);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.positions enable row level security;
alter table public.transactions enable row level security;
alter table public.market_comments enable row level security;
alter table public.leaderboard_stats enable row level security;
alter table public.news_articles enable row level security;

-- Create RLS policies
create policy "Public profiles are viewable by everyone"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

create policy "Markets are viewable by everyone"
on public.markets for select
to authenticated, anon
using (true);

create policy "Enable insert for authenticated users only"
on public.markets for insert
to authenticated
with check (true);

create policy "Users can view their own positions"
on public.positions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own positions"
on public.positions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own positions"
on public.positions for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their own transactions"
on public.transactions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own transactions"
on public.transactions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Comments are viewable by everyone"
on public.market_comments for select
to authenticated
using (true);

create policy "Authenticated users can create comments"
on public.market_comments for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Leaderboard stats are viewable by everyone"
on public.leaderboard_stats for select
to authenticated
using (true);

create policy "Enable read access for all users"
on public.news_articles for select
to authenticated, anon
using (true);

create policy "Enable insert for authenticated users only"
on public.news_articles for insert
to authenticated
with check (true);
