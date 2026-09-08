# Elishah Rides V6 – Admin Calendar

V6 එක V5 මත build කරලා Admin Dashboard එකට:

- Monthly Booking Calendar
- Selected day booking list
- Booking details modal
- Confirm / Pending status action
- WhatsApp contact button
- Daily vehicle availability
- Blocked / booked vehicle status
- Mobile responsive admin view

## Setup

1. V5 Supabase setup එක එහෙමම තියාගන්න.
2. `supabase-schema.sql` එක කලින් run කරලා නැත්නම් Supabase SQL Editor එකෙන් run කරන්න.
3. `vehicle_blocks` table එක තිබෙන බව check කරන්න.
4. `supabase-config.js` එකේ ඔබගේ Supabase URL + ANON KEY තියාගන්න.
5. `admin.html` open කරලා Supabase admin account එකෙන් login වෙන්න.

Customer login/register එකක් මේ version එකට add කරලා නැහැ.

ඊළඟ production stage එකට secure roles, email notifications, pricing engine සහ PayHere/WEBXPAY payment integration add කරන්න පුළුවන්.
