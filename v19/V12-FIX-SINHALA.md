# Elishah Rides V12 — Supabase Connection Fix

V12 fixes the admin dashboard initialization so it waits for `/api/config`
before creating the Supabase client.

## Vercel Environment Variables
Production must contain:
- SUPABASE_URL = https://ocglulvdcmmnofuwjknp.supabase.co
- SUPABASE_ANON_KEY = the Supabase Publishable key

After changing variables, redeploy the project.

## Test
1. Open `/api/config` and confirm `ok:true`.
2. Open the main site and submit a test booking.
3. Open `/admin.html` and sign in with the Supabase Auth admin user.

Do not put a Supabase secret/service_role key in the browser.
