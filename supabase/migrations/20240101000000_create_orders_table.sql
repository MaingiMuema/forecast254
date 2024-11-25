-- Create orders table
create table if not exists orders (
    id uuid default gen_random_uuid() primary key,
    market_id uuid references markets(id) not null,
    user_id uuid references auth.users(id) not null,
    order_type text check (order_type in ('limit', 'market')) not null,
    side text check (side in ('buy', 'sell')) not null,
    position text check (position in ('yes', 'no')) not null,
    price decimal check (price > 0 and price <= 1000000),
    amount integer not null check (amount > 0),
    filled_amount integer not null default 0 check (filled_amount >= 0),
    remaining_amount integer not null check (remaining_amount >= 0),
    status text check (status in ('open', 'filled', 'cancelled', 'partial')) not null default 'open',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create index for faster querying
create index if not exists orders_market_id_idx on orders(market_id);
create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_status_idx on orders(status);

-- Add RLS policies
alter table orders enable row level security;

-- Users can view all orders
create policy "Users can view all orders"
on orders for select
to authenticated
using (true);

-- Users can only insert their own orders
create policy "Users can insert their own orders"
on orders for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can only update their own orders
create policy "Users can update their own orders"
on orders for update
to authenticated
using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_orders_updated_at
    before update on orders
    for each row
    execute function update_updated_at_column();

-- Function to update remaining_amount on insert/update
create or replace function update_remaining_amount()
returns trigger as $$
begin
    new.remaining_amount = new.amount - new.filled_amount;
    -- Update status based on filled amount
    if new.remaining_amount = 0 then
        new.status = 'filled';
    elsif new.filled_amount > 0 then
        new.status = 'partial';
    end if;
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically update remaining_amount
create trigger update_orders_remaining_amount
    before insert or update of amount, filled_amount on orders
    for each row
    execute function update_remaining_amount();
