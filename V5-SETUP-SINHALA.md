# Elishah Rides V5 — Vehicle Availability

V5 adds:
- Admin vehicle availability management
- Block a specific vehicle on a specific date
- Optional reason for the block
- Remove a blocked date
- Customer booking form checks the selected vehicle/date before creating a booking
- Vehicle list is stored in Supabase

## Setup
1. Use your existing V4 Supabase project.
2. Open Supabase SQL Editor.
3. Run the UPDATED `supabase-schema.sql` from V5.
4. Make sure `supabase-config.js` still has your project URL and anon/public key.
5. Login to `admin.html`.
6. Under Fleet Availability, choose a vehicle + date and click Block Date.
7. Try booking that vehicle on that date from the website.

Note:
The current schema allows public users to read availability blocks because the public booking form needs to check availability. For a higher-security production architecture, availability checks can later be moved into a server-side Edge Function/RPC.
