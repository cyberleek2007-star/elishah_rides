-- Elishah Rides V18 — add the Van category alongside the existing seven-category UI.
-- The new Van uses the KDH-style van icon on the customer page.

insert into public.vehicle_units (category, display_name, capacity, luggage)
select 'Van','Van 01','1–9 guests','7 bags'
where not exists (select 1 from public.vehicle_units where category='Van');

insert into public.vehicles (name, capacity, luggage)
select 'Van','1–9 guests','7 bags'
where not exists (select 1 from public.vehicles where name='Van');

insert into public.pricing_rules (service,vehicle,trip_type,base_price,per_km,per_day,currency,active)
select * from (values
 ('Airport Transfer','Van','One Way',115,0,0,'USD',true),
 ('Full Day Hire','Van','Full Day Hire',190,0,190,'USD',true)
) as seed(service,vehicle,trip_type,base_price,per_km,per_day,currency,active)
where not exists (
 select 1 from public.pricing_rules p
 where p.service=seed.service and p.vehicle=seed.vehicle and p.trip_type=seed.trip_type
);
