-- Elishah Rides V17 — replace the old vehicle categories with:
-- Bike, Scooter, Flex, Car, Mini Van, Bus
-- Run this once in Supabase SQL Editor.

-- Rename the existing starter units so the live availability page immediately has one vehicle in each category.
update public.vehicle_units
set category = case category
  when 'Premium Sedan' then 'Bike'
  when 'Luxury Sedan' then 'Scooter'
  when 'SUV' then 'Flex'
  when 'Premium SUV' then 'Car'
  when 'Van' then 'Mini Van'
  when 'Luxury Van' then 'Bus'
  else category end,
  display_name = case category
  when 'Premium Sedan' then 'Bike 01'
  when 'Luxury Sedan' then 'Scooter 01'
  when 'SUV' then 'Flex 01'
  when 'Premium SUV' then 'Car 01'
  when 'Van' then 'Mini Van 01'
  when 'Luxury Van' then 'Bus 01'
  else display_name end,
  capacity = case category
  when 'Premium Sedan' then '1–2 guests'
  when 'Luxury Sedan' then '1–2 guests'
  when 'SUV' then '1–4 guests'
  when 'Premium SUV' then '1–4 guests'
  when 'Van' then '1–7 guests'
  when 'Luxury Van' then '10–50 guests'
  else capacity end,
  luggage = case category
  when 'Premium Sedan' then '1 bag'
  when 'Luxury Sedan' then '1 bag'
  when 'SUV' then '3 bags'
  when 'Premium SUV' then '3 bags'
  when 'Van' then '5 bags'
  when 'Luxury Van' then '10+ bags'
  else luggage end
where category in ('Premium Sedan','Luxury Sedan','SUV','Premium SUV','Van','Luxury Van');

-- Keep the legacy category table in sync for the existing admin calendar.
update public.vehicles set name = case name
  when 'Premium Sedan' then 'Bike'
  when 'Luxury Sedan' then 'Scooter'
  when 'SUV' then 'Flex'
  when 'Premium SUV' then 'Car'
  when 'Van' then 'Mini Van'
  when 'Luxury Van' then 'Bus'
  else name end,
  capacity = case name
  when 'Premium Sedan' then '1–2 guests'
  when 'Luxury Sedan' then '1–2 guests'
  when 'SUV' then '1–4 guests'
  when 'Premium SUV' then '1–4 guests'
  when 'Van' then '1–7 guests'
  when 'Luxury Van' then '10–50 guests'
  else capacity end,
  luggage = case name
  when 'Premium Sedan' then '1 bag'
  when 'Luxury Sedan' then '1 bag'
  when 'SUV' then '3 bags'
  when 'Premium SUV' then '3 bags'
  when 'Van' then '5 bags'
  when 'Luxury Van' then '10+ bags'
  else luggage end
where name in ('Premium Sedan','Luxury Sedan','SUV','Premium SUV','Van','Luxury Van');

-- Disable old pricing rules and create starter USD pricing for the new categories.
update public.pricing_rules set active=false
where vehicle in ('Premium Sedan','Luxury Sedan','SUV','Premium SUV','Van','Luxury Van');

insert into public.pricing_rules (service,vehicle,trip_type,base_price,per_km,per_day,currency,active)
select * from (values
 ('Airport Transfer','Bike','One Way',25,0,0,'USD',true),
 ('Airport Transfer','Scooter','One Way',30,0,0,'USD',true),
 ('Airport Transfer','Flex','One Way',55,0,0,'USD',true),
 ('Airport Transfer','Car','One Way',65,0,0,'USD',true),
 ('Airport Transfer','Mini Van','One Way',90,0,0,'USD',true),
 ('Airport Transfer','Bus','One Way',180,0,0,'USD',true),
 ('Full Day Hire','Bike','Full Day Hire',45,0,45,'USD',true),
 ('Full Day Hire','Scooter','Full Day Hire',50,0,50,'USD',true),
 ('Full Day Hire','Flex','Full Day Hire',100,0,100,'USD',true),
 ('Full Day Hire','Car','Full Day Hire',120,0,120,'USD',true),
 ('Full Day Hire','Mini Van','Full Day Hire',160,0,160,'USD',true),
 ('Full Day Hire','Bus','Full Day Hire',300,0,300,'USD',true)
) as seed(service,vehicle,trip_type,base_price,per_km,per_day,currency,active)
where not exists (
  select 1 from public.pricing_rules p
  where p.service=seed.service and p.vehicle=seed.vehicle and p.trip_type=seed.trip_type
);
