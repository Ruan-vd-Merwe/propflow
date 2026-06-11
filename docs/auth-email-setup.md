# PropTrust Auth Email Setup

## Supabase Dashboard — URL Configuration

**Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `https://proptrust.co.za` |

**Allowed Redirect URLs** — add all of these:

```
https://proptrust.co.za/auth/callback
https://proptrust.co.za/auth/callback?next=%2Fdashboard
https://proptrust.co.za/reset-password
https://proptrust.co.za/**
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
```

> If a `redirectTo` URL is not in the allowlist, Supabase silently redirects to
> the Site URL without a code. The reset page will then show "expired".

---

## Supabase Dashboard — Email Templates

**Authentication → Emails → Confirm signup**

The template must include:

```html
<a href="{{ .ConfirmationURL }}">Confirm email address</a>
```

Do **not** hardcode a URL. Supabase fills in `{{ .ConfirmationURL }}` with the
correct redirect.

**Authentication → Emails → Reset password**

The template must include:

```html
<a href="{{ .ConfirmationURL }}">Reset your password</a>
```

Same rule: let Supabase fill in the URL.

---

## Supabase Dashboard — SMTP Settings (Resend)

**Authentication → Emails → SMTP Settings**

| Setting | Value |
|---------|-------|
| Sender name | `PropTrust` |
| Sender email | `noreply@proptrust.co.za` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key (`re_...`) |

> The Resend API key used here (for Supabase SMTP) is different from
> `RESEND_API_KEY` in Vercel, which is used for transactional emails (payment
> reminders, lease notifications, etc.).

---

## Resend DNS Verification

For `noreply@proptrust.co.za` to send reliably:

1. Add `proptrust.co.za` as a sending domain in the Resend dashboard.
2. Add the SPF, DKIM, and DMARC DNS records Resend provides.
3. Wait for Resend to show the domain as **Verified**.
4. Use **exactly** the verified address as the sender.

---

## Vercel Environment Variables

Add to your Vercel project (Settings → Environment Variables):

```
NEXT_PUBLIC_SITE_URL=https://proptrust.co.za
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=PropTrust <notifications@proptrust.co.za>
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+...
```

**Redeploy after changing environment variables.**

---

## Auth Flow Reference

### Signup confirmation

```
User signs up
  → supabase.auth.signUp({ emailRedirectTo: "https://proptrust.co.za/auth/callback?next=%2Fdashboard" })
  → Supabase sends email containing {{ .ConfirmationURL }}
  → User clicks link → Supabase redirects to /auth/callback?code=PKCE_CODE
  → /auth/callback: exchangeCodeForSession(code) → upsert profile → redirect to /onboarding or /tenant/profile
```

### Password reset

```
User submits /forgot-password
  → supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://proptrust.co.za/reset-password" })
  → Supabase sends email containing {{ .ConfirmationURL }}
  → User clicks link → Supabase redirects to /reset-password?code=PKCE_CODE
  → /reset-password: exchangeCodeForSession(code) → PASSWORD_RECOVERY event → show password form
  → User submits new password → supabase.auth.updateUser({ password }) → signOut → redirect to /login?reset=success
```

---

## Debugging Checklist

### Emails not arriving

1. Supabase Dashboard → Authentication → Logs — check for send errors
2. Check spam/promotions folder
3. Check Resend dashboard for delivery status
4. Verify Resend domain DNS records are correct (SPF, DKIM, DMARC)
5. Confirm SMTP password is the Resend API key (not the Resend dashboard password)

### "Reset link expired or already used"

Most common causes, in order:

1. **`/reset-password` not in Supabase Allowed Redirect URLs** — add it (see above)
2. **`NEXT_PUBLIC_SITE_URL` not set in Vercel** — the `redirectTo` becomes `localhost:3000` in production, which Supabase rejects/ignores
3. **Email client pre-fetching** — some security scanners GET the link before the user clicks, consuming the one-time code; user must request a new link
4. **Link opened twice** — PKCE codes are single-use; opening the same email link a second time will always show expired
5. **Email is old** — Supabase reset codes expire after 1 hour; user must request a fresh link

### Confirmation link working in dev but not production

Check that:
- `NEXT_PUBLIC_SITE_URL=https://proptrust.co.za` is set in Vercel
- The production URL is in Supabase Allowed Redirect URLs
- The Vercel deployment has been redeployed after adding env vars
