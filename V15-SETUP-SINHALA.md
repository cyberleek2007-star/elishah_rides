# Elishah Rides V15 — Vehicle Category → Actual Vehicle Booking

මේ version එකේ customer flow එක මෙහෙමයි:

**Vehicle Availability → Category → Actual Vehicle → Book This Vehicle → Booking Form**

### 1. Supabase SQL
Supabase → SQL Editor → New Query වෙත ගොස් `V15-VEHICLE-CATEGORY-BOOKING.sql` file එකේ SQL එක run කරන්න.

මෙය:
- booking එකකට actual `vehicle_unit_id` save කරයි.
- public customer page එකට booking/customer details expose නොකර availability count එක ලබාදෙන secure function එකක් හදයි.
- selected date + passenger count අනුව actual vehicles පෙන්වයි.

### 2. Admin එකෙන් actual vehicles add කරන්න
Admin → **Vehicles** → **Add an actual vehicle**.

උදාහරණ:
- Category: Premium Sedan
- Vehicle name / model: Toyota Corolla Axio 01
- Registration no.: optional
- Seats: 3
- Luggage: 2

එතනින් category එකට vehicles ගණනක් add කරන්න පුළුවන්.

### 3. Vehicle එක unavailable නම්
Admin → Vehicles → **Block an individual vehicle** → vehicle + date → Block Date.

### 4. Customer side
Customer → Vehicle Availability → date/passengers select → category card එක click → ඒ category එකේ actual available vehicles පෙන්වයි → **Book this vehicle**.

Booking form එකට category එකත් exact vehicle එකත් automatically select වෙනවා.

### 5. Vehicle images
Fleet/category cards සඳහා user කැමති line-art style එක භාවිතා කරලා lightweight images `assets/vehicles/` තුළ දාලා තියෙනවා. Exact real vehicle photos දාන්න අවශ්‍ය නැහැ.

> V15 payment gateway එක live කරන්නේ නැහැ. ඒක කලින් architecture එක වගේ separate step එකක්.

## V15 Payment — Bank Transfer + PayPal

The booking form now supports **Bank Transfer** and **PayPal** as payment-method preferences.

Bank Transfer details shown to customers:
- People's Bank
- Account Name: Nuwan Chamara Edirisinghe
- Account Number: 008-2-002-2-0050775
- Branch: Anuradhapura

PayPal is currently a **manual payment-link flow**: the customer selects PayPal, submits the booking, and the payment link can be provided after the booking is confirmed. No PayPal credentials are stored in the website.

Run the latest `V15-VEHICLE-CATEGORY-BOOKING.sql` in Supabase SQL Editor once. It adds the payment method/reference columns if they do not already exist.
