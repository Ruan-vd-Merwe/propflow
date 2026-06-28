# PropTrust — Security Boundaries

Manual reference for developers. Updated when new document handling or storage is added.

---

## Storage buckets

| Bucket | Public | Who can read | Who can write | Typical contents |
|--------|--------|--------------|---------------|-----------------|
| `documents` | No | Owner (`auth.uid()` folder prefix) | Owner | Legacy tenant/personal docs |
| `property-documents` | No | Owner (folder prefix) | Owner | Inspection reports, levy statements, rates accounts, etc. |
| `bank-statements` | No | Owner (folder prefix) | Owner | Bank statements, bond statements |
| `lease-contracts` | No | Owner (folder prefix) | Owner | Signed lease agreements |
| `body-corporate-docs` | No | Owner (folder prefix) | Owner | Body corporate minutes |
| `property-images` | Varies | Depends on listing status | Owner | Listing photos (not implemented in this foundation) |

**Rule**: No bucket containing financial, identity, or contractual documents is ever set to `public = true`.

---

## Storage path convention

```
{owner_id}/{property_id}/{timestamp}_{safe_filename}
```

- `owner_id` is the Supabase `auth.uid()` — enforced by storage RLS (`(storage.foldername(name))[1] = auth.uid()::text`)
- Files uploaded to the wrong prefix are rejected at the storage policy level
- Filenames are sanitised before upload via `sanitizeFilename()` in `src/lib/documents.ts`

---

## SHA-256 hashing

The `sha256_hex` column in `property_documents` is computed client-side using `crypto.subtle.digest` before upload.

**Purpose**: duplicate detection and tamper evidence only.

**Not a security control**: SHA-256 does not replace access control. A hash stored alongside a file does not prevent unauthorised access. Row Level Security and private storage buckets are the access controls.

---

## Signed URLs

- Generated with a **60-second TTL** for view and download actions
- Generated on demand — never stored in the database
- Access is logged to `document_access_log` before the URL is returned to the client
- The 1-year signed URL previously used in the legacy upload route (`api/documents/upload`) is a known weak point; it is unchanged to avoid regressions, but new uploads via `SecureDocumentUploader` use on-demand 60s URLs only

---

## Row Level Security

All new tables have RLS enabled with owner-scoped policies:

| Table | Policy |
|-------|--------|
| `property_documents` | `owner_id = auth.uid()` for all operations |
| `document_access_log` | Select: owner of referenced document; Insert: `accessed_by = auth.uid()` |

The existing `documents` table and its policies are unchanged.

---

## API routes

| Route | Auth check | Ownership check |
|-------|-----------|-----------------|
| `POST /api/documents/upload` | `getUser()` | Supabase RLS (folder prefix) |
| `DELETE /api/documents/[id]` | `getUser()` | `doc.owner_id !== user.id` explicit check |
| `POST /api/documents/parse-body-corporate` | `getUser()` | `doc.owner_id !== user.id` explicit check + `document_type` check |
| `POST /api/portfolio/update-location` | `getUser()` | `.eq("owner_id", user.id)` in query + explicit 404 |
| `POST /api/portfolio/update-finance` | `getUser()` | `.eq("owner_id", user.id)` in query + explicit 404 |

All routes use `createClient()` from `@/lib/supabase/server` (SSR client with cookie-based auth).

---

## What is NOT implemented (do not claim otherwise)

- End-to-end encryption at rest (Supabase uses provider-managed encryption, not application-level E2EE)
- Automated POPIA compliance audit trail (access log is manual, not a legally certified audit trail)
- Virus/malware scanning of uploaded files
- Document expiry or automatic deletion policies
- Tenant-side document visibility (tenants cannot currently view property documents — only owners)
- Shared access for co-owners or agents

Use the phrase **POPIA-aligned** for data handling descriptions. Do not claim POPIA compliance.

---

## Middleware public routes

The following paths are publicly accessible without authentication (defined in `src/middleware.ts`):

```
/ /about /areas /browse/* /contact /features /for-landlords/* /for-tenants/*
/login /pricing /register /resources/* /solutions/* /trust
```

All other routes (including `/portfolio`, `/documents`, `/api/portfolio/*`, `/api/documents/*`) require an authenticated session.
