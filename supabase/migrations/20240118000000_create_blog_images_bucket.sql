-- Create blog-images storage bucket
insert into storage.buckets (id, name)
values ('blog-images', 'blog-images')
on conflict do nothing;

-- Set up storage policies
create policy "Public can view blog images"
  on storage.objects
  for select
  using (bucket_id = 'blog-images');

create policy "Authenticated users can upload blog images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'blog-images'
    and auth.role() = 'authenticated'
  );
