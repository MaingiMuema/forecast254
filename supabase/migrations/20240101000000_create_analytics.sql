create table if not exists public.analytics_page_views (
  id uuid default uuid_generate_v4() primary key,
  path text not null,
  timestamp timestamptz not null default now(),
  user_id uuid references auth.users(id),
  session_id text not null,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Create index for faster queries
create index if not exists analytics_page_views_timestamp_idx on public.analytics_page_views(timestamp);
create index if not exists analytics_page_views_session_id_idx on public.analytics_page_views(session_id);
create index if not exists analytics_page_views_path_idx on public.analytics_page_views(path);

-- Set up RLS policies
alter table public.analytics_page_views enable row level security;

create policy "Enable insert access to all users"
  on public.analytics_page_views for insert
  to authenticated, anon
  with check (true);

create policy "Enable read access to admins only"
  on public.analytics_page_views for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
