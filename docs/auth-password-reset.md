# PropTrust Password Reset Flow

## Flow diagram

```
Forgot password page
  → resetPasswordForEmail(email, { redirectTo: getAuthCallbackUrl('/reset-password') })
  → Supabase sends recovery email with {{ .ConfirmationURL }}
  → User clicks link in email
  → Supabase redirects to: /auth/callback?code=XXX&next=%2Freset-password
  → /auth/callback calls exchangeCodeForSession(code) (server-side, sets cookie)
  → Redirects to /reset-password
  → /reset-password calls getSession() → session exists → shows password form
  → User submits new password → updateUser({ password })
  → signOut() → redirect to /login?reset=success
```

## Why routing through /auth/callback matters

With `@supabase/ssr` and the PKCE flow, the code verifier is stored in server-managed
cookies. Client-side `exchangeCodeForSession` cannot reliably access it. The server-side
route handler in `/auth/callback` has full cookie read/write access and correctly
establishes the session before the browser lands on `/reset-password`.

## Required Supabase URL Configuration

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://proptrust.co.za
```

**Redirect URLs (add all of these):**
```
https://proptrust.co.za/auth/callback
https://proptrust.co.za/auth/callback?next=/reset-password
https://proptrust.co.za/reset-password
https://proptrust.co.za/**
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
```

## Required environment variables

**Vercel (production):**
```
NEXT_PUBLIC_SITE_URL=https://proptrust.co.za
```

**Local `.env.local` (development):**
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Supabase email templates

Use `{{ .ConfirmationURL }}` in the recovery email template — do not hardcode reset URLs.
Supabase injects the correct `redirectTo` URL into this variable.

## Testing checklist

1. Go to `/forgot-password`, enter a real test email, submit.
2. Confirm success message: "Check your email. We sent a password reset link to [email]."
3. Open the **newest** reset email only (old links are single-use).
4. Click the reset link.
5. Confirm the URL briefly passes through `/auth/callback?code=...&next=%2Freset-password`.
6. Confirm it lands on `/reset-password` with no `code` parameter in the URL.
7. Confirm the new password form appears (not the expired message).
8. Enter and confirm a new password, submit.
9. Confirm redirect to `/login?reset=success`.
10. Log in with the new password — confirm it works.
11. Click the same reset link again — confirm it shows expired/used.
12. Visit `/reset-password` directly (no session) — confirm it shows expired/used.
13. Confirm `/dashboard` redirects to `/login` when logged out.

## Debugging a broken flow

If `/reset-password` still shows expired after a fresh link:

1. Check the actual `redirectTo` URL being used — should be:
   `https://proptrust.co.za/auth/callback?next=%2Freset-password`
2. Confirm Vercel has `NEXT_PUBLIC_SITE_URL=https://proptrust.co.za`.
3. Confirm Supabase Redirect URLs include `https://proptrust.co.za/auth/callback`.
4. Open the reset email, inspect the link — it must contain `type=recovery` and `code=`.
5. Check Vercel function logs for `/auth/callback` — look for `auth_callback_failed`.
