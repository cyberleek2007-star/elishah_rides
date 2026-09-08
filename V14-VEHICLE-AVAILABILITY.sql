-- Elishah Rides V14: multiple real vehicles per category + customer availability
create table if not exists public.vehicle_units (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  display_name text not null,
  registration_no text,
  capacity text,
  luggage text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_unit_blocks (
  id uuid primary key default gen_random_uuid(),
  vehicle_unit_id uuid not null references public.vehicle_units(id) on delete cascade,
  block_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(vehicle_unit_id, block_date)
);

alter table public.vehicle_units enable row level security;
alter table public.vehicle_unit_blocks enable row level security;

drop policy if exists "public can read active vehicle units" on public.vehicle_units;
create policy "public can read active vehicle units" on public.vehicle_units
for select to anon, authenticated using (active = true);

drop policy if exists "authenticated admins can manage vehicle units" on public.vehicle_units;
create policy "authenticated admins can manage vehicle units" on public.vehicle_units
for all to authenticated using (true) with check (true);

drop policy if exists "public can read vehicle unit blocks" on public.vehicle_unit_blocks;
create policy "public can read vehicle unit blocks" on public.vehicle_unit_blocks
for select to anon, authenticated using (true);

drop policy if exists "authenticated admins can manage vehicle unit blocks" on public.vehicle_unit_blocks;
create policy "authenticated admins can manage vehicle unit blocks" on public.vehicle_unit_blocks
for all to authenticated using (true) with check (true);

-- Starter units preserve the existing categories. Replace/add these with your real vehicles in Admin > Vehicles.
insert into public.vehicle_units (category, display_name, capacity, luggage)
select * from (values
 ('Premium Sedan','Premium Sedan 01','1–3 guests','2 bags'),
 ('Luxury Sedan','Luxury Sedan 01','1–3 guests','2 bags'),
 ('SUV','SUV 01','1–4 guests','3 bags'),
 ('Premium SUV','Premium SUV 01','1–4 guests','3 bags'),
 ('Van','Van 01','1–7 guests','5 bags'),
 ('Luxury Van','Luxury Van 01','1–8 guests','6 bags')
) as v(category,display_name,capacity,luggage)
where not exists (select 1 from public.vehicle_units);
