# Elishah Rides V4 — Setup

## මේ version එකේ
- Customer login නැහැ.
- Booking form එක Supabase database එකට save වෙනවා.
- Admin login Supabase Authentication හරහා.
- Admin dashboard එකෙන් bookings බලන්න සහ status වෙනස් කරන්න පුළුවන්.
- Browser localStorage database එක ඉවත් කරලා real cloud database එක භාවිතා කරනවා.

## 1. Supabase project
Supabase account එකකින් new project එකක් හදන්න.

## 2. Database
Supabase SQL Editor එකට `supabase-schema.sql` file එකේ code එක paste කර Run කරන්න.

## 3. Admin account
Supabase Dashboard → Authentication → Users → Add user
ඔයාගේ admin email එක සහ strong password එක දාන්න.

## 4. Config
`supabase-config.js` open කර:
- YOUR_SUPABASE_PROJECT_URL → Supabase Project URL
- YOUR_SUPABASE_ANON_KEY → Supabase anon/public key

⚠️ `service_role` key එක කිසිම වෙලාවක website files වල දාන්න එපා.

## 5. Test
`index.html` open කර booking එකක් submit කරන්න.
ඊට පස්සේ `admin.html` open කර admin email/password එකෙන් login වෙන්න.

## Important security note
V4 uses Supabase Auth + Row Level Security. The policies in the starter SQL allow any authenticated user to read/update bookings. For a production launch, restrict the policies to a dedicated admin role/table before adding more staff accounts.

## Next
V5: Admin UI polish + booking detail page + email notifications + availability management.
