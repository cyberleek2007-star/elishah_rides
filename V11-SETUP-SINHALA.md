# Elishah Rides V11 — Supabase + Vercel Setup

## මේ version එකේ වැදගත් වෙනස
Vercel Environment Variables වල දාපු `SUPABASE_URL` සහ `SUPABASE_ANON_KEY`
දැන් website එකට `/api/config` හරහා automatically ලැබෙනවා.

## Vercel
Project → Settings → Environment Variables

මේ දෙක තිබිය යුතුයි:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

`SUPABASE_ANON_KEY` සඳහා Supabase එකේ **Publishable key** භාවිතා කරන්න.
Secret key / service_role key browser environment variable එකකට දාන්න එපා.

Production, Preview, Development අවශ්‍ය නම් තුනම select කරලා Save කරන්න.

## Deploy
GitHub repo එකට V11 files upload/push කරලා Vercel redeploy කරන්න.
Redeploy එකෙන් පස්සේ:
1. Home page එක open කරන්න.
2. Booking request එක test කරන්න.
3. Supabase → Table Editor → `bookings` බලන්න.
4. `/admin.html` open කරලා admin login test කරන්න.

## Admin login
Supabase → Authentication → Users වලින් admin user එකක් create කරන්න.
Customer login/register අවශ්‍ය නැහැ.

## Payment
PayHere/WEBXPAY තාම live නැහැ. Merchant secret keys browser එකට දාන්න එපා.
