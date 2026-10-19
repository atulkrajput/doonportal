# Security Checklist

Legend: ✅ in place and tested · 🟡 partial · ⬜ not yet

## Authentication & authorization

- ✅ Sanctum tokens; expiry 30 days; logout revokes the current token; password reset revokes all tokens
- ✅ Login/register/reset throttled (10/min per IP, 5/min per email)
- ✅ Change password (`PUT /me/password`, admin "My account" page): requires the current password, 5 attempts/min per user, signs out all other sessions, audited without password data (tested)
- ✅ Forgot-password returns the same response for unknown emails
- ✅ Roles assigned server-side only; `roles` not mass assignable; registration always gets USER (tested)
- ✅ Policies on every entity; hidden records return 404; SUPER_ADMIN via `Gate::before`
- ✅ `status`, `verified_at`, `owner_id`, rating aggregates not mass assignable; mass-assignment of guarded fields throws outside production (tested)
- ✅ Ownership derived from `businesses.owner_id` (set by claim approval), never client input
- ⬜ Email verification flow
- ✅ Admin API (`/api/v1/admin/*`): `auth:sanctum` + `admin.access` + a permission gate per section; role × endpoint matrix tested for all 7 roles (read and write), guests 401, non-staff 403, forbidden requests change nothing
- ✅ Role-escalation guards (tested): nobody changes their own roles; only SUPER_ADMIN grants/revokes ADMIN or SUPER_ADMIN or edits an administrator's account; USER always kept; business owners cannot use admin endpoints on their own listing
- ✅ Every admin state change audited (create/update/delete/restore, status, reschedule, collection items, roles, media) with actor, changed fields only, IP and user agent; audit log is read-only via the API
- ✅ Admin records addressed by ULID, not slug; status/verification/ownership/rating/`metadata` fields not writable through admin forms (tested)
- 🟡 Token in `localStorage` — XSS would expose it. Mitigations: no `dangerouslySetInnerHTML` except DOMPurify-sanitized story bodies. Plan: move to Sanctum cookie SPA auth or add CSP in Phase 12.

## Input & output

- ✅ Form Requests on all write and list endpoints; `per_page` capped at 100; sort values allowlisted
- ✅ Search `LIKE` wildcards escaped; no raw client input in SQL
- ✅ Polymorphic types enforced by morph map + per-endpoint allowlists
- ✅ API Resources expose an explicit field list (no `metadata`, `owner_id`, emails of reviewers)
- ✅ JSON errors for all `api/*` routes; no stack traces when `APP_DEBUG=false`
- ✅ Rich text: story bodies sanitized server-side on write (`App\Services\HtmlSanitizer`, symfony/html-sanitizer allowlist; scripts, styles, event handlers, iframes, forms, SVG, `javascript:`/`data:` URLs removed; links forced to `rel="noopener noreferrer nofollow"`) — unit + feature tested; DOMPurify kept on render as defence in depth
- ✅ File uploads (`MediaService`): type detected from file contents (JPEG/PNG/WebP/GIF only, SVG rejected), ≤ 5 MB, ≤ 8000×8000 px, server-generated file name and extension, `public` disk, throttled 30/min, audited; PHP/HTML disguised as images rejected (tested)
- 🟡 Uploaded images are not re-encoded or EXIF-stripped (no GD/Imagick locally); add when an image pipeline lands (Phase 9)

## Privacy

- ✅ Analytics: allowlisted names, ≤10 scalar properties, no raw IP/UA stored (daily-rotating HMAC), rate-limited
- ✅ Public reviews show author name only
- ⬜ Privacy policy text (placeholder page)

## AI

- ✅ API key only from env; never in logs/exceptions (tested); request timeout + retries
- ✅ Model output treated as untrusted JSON (must be validated by callers)
- ⬜ Prompt-injection defences, domain allowlists, budgets enforcement — Phase 14

## Platform

- ✅ Demo seeder refuses to run in production; demo records flagged and badged; admin forms cannot change the demo flag
- ✅ Admin SPA code is a separate lazy chunk; route guards mirror permissions from `/auth/me` (the API is authoritative); `/admin` disallowed in robots.txt
- ✅ Login `?next=` redirect accepts same-site paths only (no `//host` open redirect)
- ✅ CHECK constraint on review ratings (MySQL/PostgreSQL); unique constraints for one review/favourite per user per entity
- ⬜ Security headers / CSP / HSTS
- ⬜ CORS restricted to site origin in production
- ⬜ Dependency audit in CI (`composer audit`, `npm audit`)
- ⬜ Backups and restore drill
- ⬜ Payment webhook verification (Phase 8)
