# Elishah Rides V4
Real Supabase-backed booking prototype with secure Supabase Authentication for the admin area.

Files:
- index.html — customer website
- admin.html — admin login/dashboard
- supabase-config.js — project URL + anon key placeholders
- supabase-schema.sql — database + RLS starter schema
- V4-SETUP-SINHALA.md — Sinhala setup guide

No customer login. USD package prices remain. Payment is intentionally not included yet.


## V8
Production foundation for payment status, notification tracking, and secure gateway/email integration. Secrets must remain server-side.


## V9
Secure server-side payment and notification foundation added. Gateway-specific credentials and webhook verification remain server-side only.

## V10
Final premium UI/UX polish, accessibility/performance touches, SEO metadata, trust strip, and launch checklist.


## V11
V11 wires the existing Supabase frontend to Vercel Environment Variables through a small Vercel serverless `/api/config` endpoint. The Supabase publishable/anon key is public client configuration; service-role/secret keys remain server-side and are not exposed.
