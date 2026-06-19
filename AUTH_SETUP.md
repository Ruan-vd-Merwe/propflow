# Auth Setup — PropTrust

Everything required for Supabase Auth to work end-to-end in production.

---

## 1. Supabase Dashboard — URL Configuration

**Authentication → URL Configuration**

| Setting | Value |
|---|---|
| **Site URL** | `https://proptrust.co.za` |
| **Additional Redirect URLs** | See below |

Add ALL of these to Additional Redirect URLs:

```
https://proptrust.co.za/**
https://www.proptrust.co.za/**
http://localhost:3000/**
```

The `/**` wildcard covers all paths including `/auth/callback`, `/reset-password`, etc.

> **Why this matters:** Supabase validates the `emailRedirectTo` URL in every `signUp` and `resetPasswordForEmail` call against this list. If the URL isn't listed, Supabase silently falls back to the Site URL or rejects the request entirely.

---

## 2. Email Flow — What Goes Where

| Event | `emailRedirectTo` | Lands on |
|---|---|---|
| Signup confirmation | `/auth/callback?next=/dashboard` | `/auth/callback` → exchanges code → `/onboarding` or `/tenant/profile` |
| Password reset | `/reset-password` | `/reset-password` → user exchanges code directly → updates password |
| Resend confirmation | `/auth/callback?next=/dashboard` | Same as signup confirmation |

---

## 3. Email Templates

In **Authentication → Email Templates**, ensure every template uses:

```
{{ .ConfirmationURL }}
```

as the link href. Do **not** hardcode a domain. Supabase replaces this with the full redirect URL including the one-time code.

Example (Confirm signup template):

```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

---

## 4. SMTP Configuration (Resend)

By default Supabase uses its own email service, which is limited to **4 emails per hour** on the free plan. For production, configure Resend as the SMTP provider.

**Authentication → SMTP Settings** — enable Custom SMTP and fill in:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key (`re_...`) |
| Sender email | `notifications@proptrust.co.za` |
| Sender name | `PropTrust` |

**Resend domain verification (required for `@proptrust.co.za`):**

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add domain `proptrust.co.za`
3. Add the DNS records shown (SPF, DKIM, DMARC) to your DNS provider
4. Click **Verify**

> The domain must be verified before Resend will deliver from `@proptrust.co.za`. Unverified domains get a 550 rejection.

---

## 5. Vercel Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables** for the Production environment:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://proptrust.co.za` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zmoeflmxbrivxbnritbc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key from Supabase → Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role key — **never** expose as `NEXT_PUBLIC_`) |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM_EMAIL` | `PropTrust <notifications@proptrust.co.za>` |

> `NEXT_PUBLIC_SITE_URL` is used by server-side API routes (e.g. `/api/auth/resend-confirmation`) to build redirect URLs. Without it set on Vercel, the server would generate `http://localhost:3000/auth/callback` which Supabase will reject.

---

## 6. Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **not** prefixed with `NEXT_PUBLIC_` (it bypasses RLS — never expose to the browser)
- [ ] `RESEND_API_KEY` is **not** prefixed with `NEXT_PUBLIC_`
- [ ] Email confirmation is **enabled** in Authentication → Providers → Email (do not disable)
- [ ] "Confirm email" toggle is ON under Authentication → Providers → Email

---

## 7. Testing a Brand-New Signup

1. Open an incognito window and go to `https://proptrust.co.za/register`
2. Sign up with a fresh email address you control
3. You should see the "Check your email" confirmation screen
4. Open the email — the link should point to `https://proptrust.co.za/auth/callback?...`
5. Click the link — you should land on `/onboarding` (landlord) or `/tenant/profile` (tenant-only)
6. If the link is missing or goes to `supabase.co/...` directly instead of `proptrust.co.za`, the Site URL or Redirect URLs in Supabase are not configured correctly (see Section 1)

**To test locally:**

```bash
npm run dev
# Visit http://localhost:3000/register
# NEXT_PUBLIC_SITE_URL=http://localhost:3000 must be in .env.local
# so the confirmation email links to http://localhost:3000/auth/callback
```

---

## 8. Common Errors

| Error | Likely cause | Fix |
|---|---|---|
| "Error sending confirmation email" | SMTP not configured or Resend domain unverified | Section 4 |
| Confirmation link goes to wrong domain | Site URL or Redirect URLs wrong in Supabase | Section 1 |
| "Invalid redirect URL" | `emailRedirectTo` not in allowed list | Section 1 |
| Link expires immediately | User already confirmed this email — just sign in | — |
| Resend button fails in production | `NEXT_PUBLIC_SITE_URL` not set in Vercel | Section 5 |
