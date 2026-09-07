# Elishah Rides V7

V7 adds an admin-controlled USD pricing system and prepares the booking UI for future payment/email integration.

## 1. Supabase
Run `supabase-schema.sql` in Supabase SQL Editor. This includes the new `pricing_rules` table.

## 2. Admin
Open `admin.html` and sign in. The new Pricing Rules section lets you add and delete service/vehicle pricing.

## 3. Customer booking
The public booking form can show an estimated starting price when a matching pricing rule exists. Otherwise it shows “Request a quote”.

## 4. Email notifications
For real email sending, use a server-side Edge Function or your preferred email provider. Do not put SMTP/API secrets in browser JavaScript.

Recommended events:
- New booking → business notification
- Booking confirmed → customer confirmation
- Booking cancelled → customer notification

## 5. Payment
The structure is intentionally payment-ready but does NOT pretend payment is active.

For PayHere/WEBXPAY production integration:
- create the payment request server-side
- keep merchant credentials server-side
- verify payment callbacks/webhooks server-side
- update booking payment status only after verified payment
- never trust a browser-supplied “paid” value

## 6. Currency
Package prices remain separate and in USD as requested.
