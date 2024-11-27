-- Drop the existing policy
drop policy if exists "Users can view all orders" on orders;

-- Create new policy allowing public access to orders
create policy "Public can view all orders"
on orders for select
using (true);
