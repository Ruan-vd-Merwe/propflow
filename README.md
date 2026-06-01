# PropTrust

South Africa's trusted property platform. Track tenants, payments, and risk scores — replacing the need for a rental agent.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **Vercel** (deployment)

---

## Local Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run the schema

In the **Supabase SQL Editor**, paste and run `supabase/schema.sql`.

### 3. Create the test user

In the Supabase dashboard → **Authentication → Users → Add User**:
- Email: `test@proptrust.co.za`
- Password: `password123`

### 4. Seed the database

In the SQL Editor, paste and run `supabase/seed.sql`.

### 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with `test@proptrust.co.za` / `password123`.

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Add the two env vars in **Vercel → Project → Settings → Environment Variables**.

---

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email + password login |
| `/dashboard` | All properties, summary stats, tenant risk overview |
| `/properties/[id]` | Tenants in a property, sorted by risk |
| `/tenants/[id]` | Tenant profile, payment history, risk breakdown |

---

## Risk Score

Starts at **100**. Adjustments:

| Event | Points |
|-------|--------|
| Missed payment | −20 |
| Late payment | −8 |
| >14 days late | additional −5 |
| 3 consecutive on-time payments | +10 |

🟢 80–100 Low Risk · 🟡 50–79 Medium Risk · 🔴 0–49 High Risk

---

## Seed Tenants

| Tenant | History | Expected Score |
|--------|---------|---------------|
| Sarah Dlamini | 6 on-time payments | ~100 (green) |
| James Fortuin | 2 missed, 1 late, 3 on-time | ~52 (amber) |
| Andre Visser | 4 missed, 2 on-time | ~20 (red) |
