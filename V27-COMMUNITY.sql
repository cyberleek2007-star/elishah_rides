-- Elishah Rides V27 — public traveller uploads + comments
-- Run in Supabase SQL Editor. Submissions are pending by default; approve them from SQL/Admin moderation.
create extension if not exists pgcrypto;

create table if not exists public.community_photos (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  caption text check (caption is null or char_length(caption) <= 180),
  storage_path text not null unique,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  comment text not null check (char_length(comment) between 1 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.community_photos enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "Public can read approved community photos" on public.community_photos;
create policy "Public can read approved community photos" on public.community_photos for select using (status='approved');
drop policy if exists "Public can submit community photos" on public.community_photos;
create policy "Public can submit community photos" on public.community_photos for insert with check (status='pending');
drop policy if exists "Admins manage community photos" on public.community_photos;
create policy "Admins manage community photos" on public.community_photos for all to authenticated using (true) with check (true);

drop policy if exists "Public can read approved community comments" on public.community_comments;
create policy "Public can read approved community comments" on public.community_comments for select using (status='approved');
drop policy if exists "Public can submit community comments" on public.community_comments;
create policy "Public can submit community comments" on public.community_comments for insert with check (status='pending');
drop policy if exists "Admins manage community comments" on public.community_comments;
create policy "Admins manage community comments" on public.community_comments for all to authenticated using (true) with check (true);

insert into storage.buckets (id,name,public) values ('community-gallery','community-gallery',true) on conflict (id) do update set public=true;

drop policy if exists "Public can upload community photos" on storage.objects;
create policy "Public can upload community photos" on storage.objects for insert to anon,authenticated with check (bucket_id='community-gallery' and name like 'public/%');
drop policy if exists "Public can view community photos" on storage.objects;
create policy "Public can view community photos" on storage.objects for select to anon,authenticated using (bucket_id='community-gallery');
drop policy if exists "Admins can delete community photos" on storage.objects;
create policy "Admins can delete community photos" on storage.objects for delete to authenticated using (bucket_id='community-gallery');

-- After reviewing submissions, approve with:
-- update public.community_photos set status='approved' where id='PHOTO_UUID';
-- update public.community_comments set status='approved' where id='COMMENT_UUID';
