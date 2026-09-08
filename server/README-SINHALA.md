# V9 Secure Server Setup

මේ folder එක payment/email සඳහා secure backend foundation එක.

## Run
1. `server` folder එකට terminal එකෙන් යන්න.
2. `npm install`
3. `.env.example` copy කරලා `.env` කරන්න.
4. Real credentials `.env` එකට පමණක් දාන්න.
5. `npm start`

## වැදගත්
- `SUPABASE_SERVICE_ROLE_KEY` browser code එකට දාන්න එපා.
- PayHere/WEBXPAY secret browser code එකට දාන්න එපා.
- Gateway webhook එකේ signature/hash verification අනිවාර්යයි.
- V9 එක gateway එකක් fake ලෙස Paid කරන implementation එකක් නොවේ.

Gateway එක තෝරාගත් පසු official merchant documentation අනුව adapter එක පමණක් complete කළ යුතුයි.
