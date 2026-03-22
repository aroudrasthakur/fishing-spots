-- Run in Supabase SQL editor or via supabase db push.
-- Enables PostGIS and creates public fishing spots with RLS.

create extension if not exists postgis;

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  species text[] not null default '{}',
  access_type text,
  longitude double precision not null,
  latitude double precision not null,
  created_at timestamptz not null default now(),
  constraint spots_longitude_chk check (longitude >= -180 and longitude <= 180),
  constraint spots_latitude_chk check (latitude >= -90 and latitude <= 90)
);

create index if not exists spots_location_gix on public.spots using gist (
  st_setsrid (st_makepoint (longitude, latitude), 4326)
);

create index if not exists spots_created_at_idx on public.spots (created_at desc);

alter table public.spots enable row level security;

create policy "spots_select_public" on public.spots for select using (true);

create policy "spots_insert_own" on public.spots for insert
with check (auth.uid() = user_id);

create policy "spots_update_own" on public.spots for update
using (auth.uid() = user_id);

create policy "spots_delete_own" on public.spots for delete using (auth.uid() = user_id);
