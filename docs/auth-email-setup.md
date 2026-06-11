# Auth & Email Setup

## Supabase Dashboard Checklist

### Authentication → URL Configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://proptrust.co.za` |

**Allowed Redirect URLs** — add all of these:

```
https://proptrust.co.za/auth/callback
https://proptrust.co.za/auth/callback?next=/dashboard
https://proptrust.co.za/auth/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
```

> If a `redirectTo` URL is not in the allowlist, Supabase silently falls back to the Site URL and the auth code is never forwarded to your page.

### Authentication → Providers

- Email provider: **enabled**
- Confirm email: **enabled** (do not disable in production)

### Authentication → Email Templates

- **Confirm signup** template: active
- **Reset password** template: active

Check that the `{{ .ConfirmationURL }}` variable is included in both templates.

---

## Environment Variables

Required in `.env.local` (dev) and Vercel project settings (production):

```env
# Used for auth redirect URLs — must match Supabase Site URL above
NEXT_PUBLIC_SITE_URL=https://proptrust.co.za

# Resend — for payment/lease/introduction notification emails
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=PropTrust <notifications@proptrust.co.za>
```

> **Note**: Supabase Auth emails (confirmation, password reset) are sent by Supabase, not Resend. Configure their SMTP in the Supabase dashboard if you want custom branding on those emails.

---

## Auth Flow Reference

### Signup confirmation

1. User registers → `supabase.auth.signUp({ emailRedirectTo: "${SITE_URL}/auth/callback" })`
2. Supabase sends confirmation email with a link pointing to Supabase servers
3. Supabase redirects to `${SITE_URL}/auth/callback?code=PKCE_CODE`
4. `/auth/callback` calls `exchangeCodeForSession(code)`, upserts profile, redirects to `/onboarding` or `/tenant/profile`

### Password reset

1. User enters email on `/forgot-password`
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: "${SITE_URL}/auth/reset-password" })`
3. Supabase sends reset email
4. User clicks link → Supabase redirects to `${SITE_URL}/auth/reset-password?code=PKCE_CODE`
5. `/auth/reset-password` calls `exchangeCodeForSession(code)`, waits for `PASSWORD_RECOVERY` auth event
6. User enters new password → `supabase.auth.updateUser({ password })`

### Resend confirmation

- From register page: `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })`
- From login page (unconfirmed banner): same
- From `/api/auth/resend-confirmation` route: same (server-side)

---

## Debugging

### Emails not arriving

1. Check Supabase Dashboard → Authentication → Logs
2. Check spam/promotions folder
3. Supabase free tier has rate limits on auth emails — check if limits are hit
4. If using custom SMTP: verify SPF/DKIM DNS records for your sending domain

### "Reset link expired or already used"

Most common causes:
- **Email client pre-fetching**: Some email security scanners GET the reset link, consuming the one-time code before the user clicks. Solution: request a new link immediately.
- **Link opened twice**: The PKCE code is single-use. If you click the link again after the first exchange, it will fail.
- **`redirectTo` URL not in allowlist**: Supabase ignores the redirect and the code is never sent to your page.
- **Wrong `NEXT_PUBLIC_SITE_URL`**: The forgot-password page sends a `redirectTo` for `localhost` in production (or vice versa). Fix by setting `NEXT_PUBLIC_SITE_URL` correctly in your environment.

### Confirmation link goes to wrong environment

- Ensure `NEXT_PUBLIC_SITE_URL` is set in both `.env.local` and Vercel environment variables
- The value in `.env.local` overrides the fallback to `window.location.origin`

---

## Custom SMTP / Resend for Auth Emails

To use Resend (or another SMTP provider) for Supabase Auth emails:

1. Supabase Dashboard → Project Settings → Auth → SMTP Settings
2. Enter your SMTP credentials (Resend supports SMTP on paid plans)
3. Set the sender to match your verified Resend domain

This is separate from the `RESEND_API_KEY` used for notification emails in the app.
