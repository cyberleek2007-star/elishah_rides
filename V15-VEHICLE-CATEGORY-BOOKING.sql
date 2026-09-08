-- Elishah Rides V15
-- Category -> actual vehicle selection + secure public availability RPC

alter table public.bookings add column if not exists vehicle_unit_id uuid references public.vehicle_units(id) on delete set null;

drop function if exists public.get_public_vehicle_availability(date, integer);

create function public.get_public_vehicle_availability(p_date date, p_passengers integer default 1)
returns table(
  id uuid,
  category text,
  display_name text,
  registration_no text,
  capacity text,
  luggage text,
  notes text,
  available boolean
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      vu.id, vu.category, vu.display_name, vu.registration_no,
      coalesce(nullif(substring(vu.capacity from '([0-9]+)[^0-9]*$'), ''), '0')::integer as capacity,
      vu.luggage, vu.notes,
      exists (
        select 1 from public.vehicle_unit_blocks b
        where b.vehicle_unit_id = vu.id and b.block_date = p_date
      ) as is_blocked,
      exists (
        select 1 from public.bookings bk
        where bk.travel_date = p_date
          and bk.status in ('Pending','Confirmed')
          and bk.vehicle_unit_id = vu.id
      ) as is_unit_booked
    from public.vehicle_units vu
    where vu.active = true
      and coalesce(nullif(substring(vu.capacity from '([0-9]+)[^0-9]*$'), ''), '0')::integer >= greatest(1,p_passengers)
  ),
  legacy_counts as (
    select vehicle as category, count(*)::integer as legacy_bookings
    from public.bookings
    where travel_date = p_date
      and status in ('Pending','Confirmed')
      and vehicle_unit_id is null
    group by vehicle
  ),
  ranked as (
    select b.*, coalesce(l.legacy_bookings,0) as legacy_bookings,
      row_number() over(partition by b.category order by b.display_name, b.id) as rn
    from base b left join legacy_counts l on l.category=b.category
  )
  select r.id,r.category,r.display_name,r.registration_no,r.capacity::text,r.luggage::text,r.notes,
    (not r.is_blocked and not r.is_unit_booked and r.rn > r.legacy_bookings) as available
  from ranked r
  order by r.category, r.display_name;
$$;

grant execute on function public.get_public_vehicle_availability(date, integer) to anon, authenticated;

-- Payment preference and tracking
alter table public.bookings add column if not exists payment_method text;
alter table public.bookings add column if not exists payment_status text not null default 'Unpaid';
alter table public.bookings add column if not exists payment_reference text;
