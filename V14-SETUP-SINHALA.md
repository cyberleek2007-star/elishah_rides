# Elishah Rides V14 — Customer Vehicle Availability

## මේ version එකේ
- Customer සඳහා වෙනම `availability.html` page එකක්.
- Date + passengers තෝරලා category එකකට available vehicles ගණන පෙන්වයි.
- Premium Sedan වගේ එකම category එකට vehicles කිහිපයක් තබාගන්න පුළුවන්.
- Individual vehicle block dates support.
- Pending/Confirmed bookings available count එකෙන් අඩු කරයි.
- Public booking submit එකත් `vehicle_units` availability check එක භාවිතා කරයි.

## Supabase එකේ එක වතාවක් කරන්න
1. Supabase Dashboard → SQL Editor.
2. `V14-VEHICLE-AVAILABILITY.sql` file එකේ SQL එක copy/paste කරන්න.
3. Run කරන්න.

Starter units 6ක් auto-create වෙනවා. ඒවා temporary placeholders. පසුව Admin > Vehicles තුළ actual vehicles add/update කරන්න.

## Customer page
`/availability.html`

Home page එකේ `Vehicle Availability` link එකත් තියෙනවා.
