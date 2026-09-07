# Elishah Rides V8 – Production Ready Foundation

V8 එකේ payment සහ notification system එක production integration එකකට සූදානම් කරලා තියෙනවා.

### අලුත් fields
- payment_status
- payment_reference
- notification_status
- quoted_amount
- currency

### ඉතා වැදගත්
PayHere / WEBXPAY merchant credentials browser එකේ දාන්න එපා.
Email API keys / SMTP passwords ද browser JavaScript එකේ දාන්න එපා.

### Production flow
1. Customer booking submit කරයි.
2. Booking එක Supabase එකේ Unpaid / Pending state එකෙන් save වෙයි.
3. Server-side payment endpoint එක payment request එක create කරයි.
4. Gateway callback/webhook එක server එකෙන් verify කරයි.
5. Verified payment එකෙන් පසුව payment_status = Paid කරයි.
6. Customer confirmation email එක server-side email service එකෙන් යවයි.
7. Admin dashboard එකෙන් status/payment/notification state බලන්න පුළුවන්.

### දැනට live නොවන දේ
මෙම V8 ZIP එකෙන් PayHere/WEBXPAY payment එක fake ලෙස “Paid” කරන implementation එකක් දාලා නැහැ. Merchant account credentials සහ secure server endpoint නැතිව ඒක කිරීම unsafe.

### Business details
Email: elishahrides@gmail.com
WhatsApp: +94 77 352 3762
Currency: USD
