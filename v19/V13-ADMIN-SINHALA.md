# Elishah Rides V13 — Admin Dashboard (සිංහල)

V13 එකේ Admin එක සරල pages වලට වෙන් කරලා තියෙනවා.

## Pages
- `admin.html` — Login පමණයි. Login නොවී dashboard pages බලන්න බැහැ.
- `dashboard.html` — Overview / counts / recent bookings
- `bookings.html` — සියලු bookings, search, status, full details, WhatsApp
- `calendar.html` — මාසික booking calendar + vehicle availability
- `vehicles.html` — vehicle blocked dates
- `pricing.html` — USD pricing rules
- `settings.html` — business/system information

## Upload
V13 ZIP එක extract කරලා files GitHub repository එකේ root එකට upload/replace කරන්න.
ඊට පස්සේ Vercel deployment එක automatically update වෙයි.

## වැදගත්
Supabase email/password login එක සඳහා Supabase Authentication > Users තුළ admin user එකක් තිබිය යුතුයි.

Customer login/register එකක් V13 එකේ නැහැ.

## Booking read issue
V13 එක bookings/calendar query error එක screen එකේ පැහැදිලිව පෙන්වනවා. එම නිසා Supabase RLS/query issue එකක් තිබුණොත් blank page එකක් වෙනුවට error message එක පේනවා.
