# Security Checklist

Legend: ✅ in place and tested · 🟡 partial · ⬜ not yet

## Authentication & authorization

- ✅ Sanctum tokens; expiry 30 days; logout revokes the current token; password reset revokes all tokens
- ✅ Login/register/reset throttled (10/min per IP, 5/min per email)
- ✅ Forgot-password returns the same response for unknown emails
- ✅ Roles assigned server-side only; `roles` not mass assignable; registration always gets USER (tested)
- ✅ Policies on every entity; hidden records return 404; SUPER_ADMIN via `Gate::before`
- ✅ `status`, `verified_at`, `owner_id`, rating aggregates not mass assignable; mass-assignment of guarded fields throws outside production (tested)
- ✅ Ownership derived from `businesses.owner_id` (set by claim approval), never client input
- ⬜ Email verification flow
- ⬜ Role-escalation tests for admin endpoints (Phase 3)
- 🟡 Token in `localStorage` — XSS would expose it. Mitigations: no `dangerouslySetInnerHTML` except DOMPurify-sanitized story bodies. Plan: move to Sanctum cookie SPA auth or add CSP in Phase 12.

## Input & output

- ✅ Form Requests on all write and list endpoints; `per_page` capped at 100; sort values allowlisted
- ✅ Search `LIKE` wildcards escaped; no raw client input in SQL
- ✅ Polymorphic types enforced by morph map + per-endpoint allowlists
- ✅ API Resources expose an explicit field list (no `metadata`, `owner_id`, emails of reviewers)
- ✅ JSON errors for all `api/*` routes; no stack traces when `APP_DEBUG=false`
- 🟡 Rich text: DOMPurify on render; server-side sanitizer due with the editorial CMS (Phase 6)
- ⬜ File upload validation (no uploads yet)

## Privacy

- ✅ Analytics: allowlisted names, ≤10 scalar properties, no raw IP/UA stored (daily-rotating HMAC), rate-limited
- ✅ Public reviews show author name only
- ⬜ Privacy policy text (placeholder page)

## AI

- ✅ API key only from env; never in logs/exceptions (tested); request timeout + retries
- ✅ Model output treated as untrusted JSON (must be validated by callers)
- ⬜ Prompt-injection defences, domain allowlists, budgets enforcement — Phase 14

## Platform

- ✅ Demo seeder refuses to run in production; demo records flagged and badged
- ✅ CHECK constraint on review ratings (MySQL/PostgreSQL); unique constraints for one review/favourite per user per entity
- ⬜ Security headers / CSP / HSTS
- ⬜ CORS restricted to site origin in production
- ⬜ Dependency audit in CI (`composer audit`, `npm audit`)
- ⬜ Backups and restore drill
- ⬜ Payment webhook verification (Phase 8)
