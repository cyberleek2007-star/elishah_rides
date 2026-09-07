# Elishah Rides V9

V9 = Secure Payment + Notification Backend Foundation.

## දැන් තියෙන දේ
- Secure Node/Express backend starter
- Payment create endpoint
- Payment webhook endpoint
- Booking notification endpoint
- Environment variable configuration
- Merchant secrets browser එකෙන් වෙන් කිරීම
- Existing V8 Supabase + pricing + calendar + booking system retained

## දැනට Live නොවන දේ
PayHere/WEBXPAY specific payment API සහ email provider API credentials නැති නිසා V9 එක ඒවා fake කරන්නේ නැහැ.

## Next production step
ඔබගේ business එකට **PayHere හෝ WEBXPAY** වලින් එකක් select කර merchant account/API documentation ලබාගත් පසු gateway-specific adapter එක connect කළ හැක.

Email සඳහා SMTP/transactional email provider එකක් server-side connect කළ හැක.
