# Elishah Rides V29 — Community Admin Fix

Dashboard sidebar එකට Community menu එක add කරලා තියෙනවා. Community Quick Action එකේ pending photo/comment count එකත් පෙන්වනවා.

## Test
1. Public website එකෙන් photo/comment submit කරන්න.
2. Supabase `community_photos` / `community_comments` වල `pending` record එකක් තියෙනවාද බලන්න.
3. Admin Dashboard → Community යන්න.
4. Pending submission එක review list එකේ පෙනෙයි.
5. Approve කළාම website එකේ public community section එකේ පෙනෙයි.

## Important
`V27-COMMUNITY.sql` Supabase SQL Editor එකේ run කරලා නැත්නම් run කරන්න.
