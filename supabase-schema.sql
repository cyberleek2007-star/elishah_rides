-- Elishah Rides V4 — Supabase setup
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  status text not null default 'Pending'
    check (status in ('Pending','Confirmed','Completed','Cancelled')),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text,
  service text not null,
  pickup text not null,
  destination text not null,
  travel_date date not null,
  pickup_time time not null,
  passengers integer not null default 2,
  vehicle text,
  notes text
);

alter table public.bookings enable row level security;

-- Customers can create booking requests without an account.
create policy "public can create booking requests"
on public.bookings for insert
to anon, authenticated
with check (true);

-- Only authenticated admins can read/update bookings.
create policy "authenticated admins can read bookings"
on public.bookings for select
to authenticated
using (true);

create policy "authenticated admins can update bookings"
on public.bookings for update
to authenticated
using (true)
with check (true);

-- Optional: restrict authenticated access to your own admin users later.
-- For stronger production security, create a public.admin_users table and
-- change the select/update policies to check that table.


-- Vehicle availability management
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  capacity text,
  luggage text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_blocks (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  block_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(vehicle_id, block_date)
);

alter table public.vehicles enable row level security;
alter table public.vehicle_blocks enable row level security;

-- Public website may read active vehicles and availability blocks.
create policy "public can read active vehicles"
on public.vehicles for select
to anon, authenticated
using (active = true);

create policy "authenticated admins can manage vehicles"
on public.vehicles for all
to authenticated
using (true)
with check (true);

create policy "public can read vehicle blocks"
on public.vehicle_blocks for select
to anon, authenticated
using (true);

create policy "authenticated admins can manage vehicle blocks"
on public.vehicle_blocks for all
to authenticated
using (true)
with check (true);

insert into public.vehicles (name,capacity,luggage) values
('Premium Sedan','1–3 guests','2 bags'),
('Luxury Sedan','1–3 guests','2 bags'),
('SUV','1–4 guests','3 bags'),
('Premium SUV','1–4 guests','3 bags'),
('Van','1–7 guests','5 bags'),
('Luxury Van','1–8 guests','6 bags')
on conflict (name) do nothing;


-- V7: Admin-controlled pricing
create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  vehicle text,
  trip_type text,
  base_price numeric(10,2) not null default 0,
  per_km numeric(10,2) not null default 0,
  per_day numeric(10,2) not null default 0,
  currency text not null default 'USD',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pricing_rules enable row level security;

drop policy if exists "Public can read active pricing" on public.pricing_rules;
create policy "Public can read active pricing"
on public.pricing_rules for select
to anon, authenticated
using (active = true);

drop policy if exists "Authenticated admins can manage pricing" on public.pricing_rules;
create policy "Authenticated admins can manage pricing"
on public.pricing_rules for all
to authenticated
using (true)
with check (true);

insert into public.pricing_rules (service, vehicle, trip_type, base_price, per_km, per_day, currency)
select * from (values
  ('Airport Transfer','Premium Sedan','One Way',65,0,0,'USD'),
  ('Airport Transfer','Luxury Sedan','One Way',85,0,0,'USD'),
  ('Airport Transfer','SUV','One Way',95,0,0,'USD'),
  ('Full Day Hire','Premium Sedan','Full Day Hire',120,0,120,'USD'),
  ('Full Day Hire','Luxury Sedan','Full Day Hire',160,0,160,'USD'),
  ('Full Day Hire','SUV','Full Day Hire',150,0,150,'USD'),
  ('Private Day Tours','Premium Sedan','One Way',140,0,140,'USD'),
  ('Private Day Tours','SUV','One Way',175,0,175,'USD')
) as seed(service, vehicle, trip_type, base_price, per_km, per_day, currency)
where not exists (select 1 from public.pricing_rules);


-- V8: payment + notification tracking
alter table public.bookings
  add column if not exists payment_status text not null default 'Unpaid'
  check (payment_status in ('Unpaid','Pending','Paid','Failed','Refunded'));

alter table public.bookings
  add column if not exists payment_reference text;

alter table public.bookings
  add column if not exists notification_status text not null default 'Not Sent'
  check (notification_status in ('Not Sent','Queued','Sent','Failed'));

alter table public.bookings
  add column if not exists quoted_amount numeric(10,2);

alter table public.bookings
  add column if not exists currency text not null default 'USD';
