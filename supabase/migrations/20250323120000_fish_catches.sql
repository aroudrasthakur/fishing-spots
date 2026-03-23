-- Fish catch photos: map pins with public imagery stored in Supabase Storage.
-- Run after 20250322000000_spots.sql

create table if not exists public.fish_catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  species text[] not null default '{}',
  notes text,
  image_url text not null,
  longitude double precision not null,
  latitude double precision not null,
  created_at timestamptz not null default now(),
  constraint fish_catches_longitude_chk check (longitude >= -180 and longitude <= 180),
  constraint fish_catches_latitude_chk check (latitude >= -90 and latitude <= 90)
);

create index if not exists fish_catches_location_gix on public.fish_catches using gist (
  st_setsrid (st_makepoint (longitude, latitude), 4326)
);

create index if not exists fish_catches_created_at_idx on public.fish_catches (created_at desc);

alter table public.fish_catches enable row level security;

create policy "fish_catches_select_public" on public.fish_catches for select using (true);

create policy "fish_catches_insert_own" on public.fish_catches for insert
with check (auth.uid() = user_id);

create policy "fish_catches_update_own" on public.fish_catches for update
using (auth.uid() = user_id);

create policy "fish_catches_delete_own" on public.fish_catches for delete using (auth.uid() = user_id);

-- Public bucket for catch photos (first path segment must be uploader uid; enforced below).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catch-photos',
  'catch-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "catch_photos_select_public"
on storage.objects for select
using (bucket_id = 'catch-photos');

create policy "catch_photos_insert_own_folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'catch-photos'
  and name like auth.uid()::text || '/%'
);

create policy "catch_photos_update_own_folder"
on storage.objects for update to authenticated
using (bucket_id = 'catch-photos' and name like auth.uid()::text || '/%')
with check (bucket_id = 'catch-photos' and name like auth.uid()::text || '/%');

create policy "catch_photos_delete_own_folder"
on storage.objects for delete to authenticated
using (bucket_id = 'catch-photos' and name like auth.uid()::text || '/%');
