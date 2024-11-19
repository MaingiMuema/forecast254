-- Add missing columns to markets table
alter table public.markets
add column if not exists title text not null,
add column if not exists question text not null,
add column if not exists description text not null,
add column if not exists category text not null,
add column if not exists end_date timestamp with time zone not null,
add column if not exists resolution_date timestamp with time zone not null default end_date,
add column if not exists resolution_criteria text not null,
add column if not exists status text not null default 'open',
add column if not exists resolved_value boolean,
add column if not exists creator_id uuid not null,
add column if not exists probability_yes numeric not null default 0.5,
add column if not exists probability_no numeric not null default 0.5;

-- Create indexes for performance
create index if not exists idx_markets_end_date 
on public.markets(end_date);
create index if not exists idx_markets_category
on public.markets(category);
create index if not exists idx_markets_status
on public.markets(status);
create index if not exists idx_markets_creator
on public.markets(creator_id);

-- Grant necessary permissions
grant all on public.markets to authenticated;
grant all on public.markets to anon;
