# DoonPortal — Master Audit Report

_Audit date: 2026-10-20 · Auditor: Claude Code (automated audit, with runtime verification where possible)_

Related: [FEATURE_MATRIX.md](FEATURE_MATRIX.md) · [FAILED_TESTS.md](FAILED_TESTS.md) · [SECURITY_FINDINGS.md](SECURITY_FINDINGS.md) · [AI_DATA_ENGINE_AUDIT.md](AI_DATA_ENGINE_AUDIT.md) · [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md)

## 1. Scope and what was audited

- `master` (`90b8616`) is an unmodified Laravel 12 skeleton with no DoonPortal code.
- The DoonPortal implementation lives on `claude/phase3-admin-cms` (`c79c59f`), a superset of `claude/doonportal-agentic-setup-aaaa92` (Phases 0–2). **That tip is what was audited.** It was fast-forwarded into `claude/doonportal-feature-audit-05571e`, and the audit fixes sit on top. No other branch or worktree was modified.
- Stack: PHP 8.2.12, Laravel 12.69.3, Sanctum 4, PHPUnit 11.5; React 19 + React Router, Vite 7.3.7, Tailwind 4; MariaDB 10.4.32 (dev and test), SQLite (tests); database queue driver (unused); no scheduler entries.
- Product reference: `docs/product-blueprint.md`, `docs/api-specification.md`, `docs/database-erd.md`, `docs/ai-data-engine.md`, `docs/implementation-status.md`.

## 2. Overall status

Phases 0–3 (foundation, schema, public discovery, admin CMS, SEO, manual monetization, legal pages) are **implemented to a high standard and verified**. The project's own claim of 123 passing tests was reproduced exactly, then extended. Phases 4–15 are **largely not started**: owner portal and claims, community, reviews, favourites, map, payments, notifications/PWA, search ranking, and the entire AI Data Engine apart from its provider layer.

**Launch readiness: NOT READY.** No critical security or data-integrity defect is open. Readiness fails on missing core scope (claims, community, AI engine), missing launch infrastructure (staging, backups and restore drill, monitoring), missing hardening (CSP and security headers, token storage) and unfilled legal details.

## 3. Feature counts (145 rows in the feature matrix)

| Status | Count |
|---|---|
| PASS | 83 (4 of them after fixes made in this audit) |
| PARTIAL | 13 |
| FAIL | 0 open (4 found and fixed) |
| MISSING | 45 |
| BLOCKED | 2 (`composer audit`, GitHub CI run) |
| NOT_APPLICABLE | 2 (payment collection by roadmap; unsafe AI publication path, which does not exist) |

## 4. Findings by severity

| Severity | Open | Fixed in audit | Notes |
|---|---|---|---|
| P0 | 0 | 0 | — |
| P1 | 0 | 0 | — |
| P2 | 29 | 2 | Mostly missing scope (claims, reviews, favourites, moderation, AI engine components) and launch infrastructure; also security headers, token storage, duplicate detection, rating aggregates, E2E tests |
| P3 | 32 | 2 | Hardening and polish |

The fixed P2s were the all-day event lifecycle and the event date-window filter. The fixed P3s were WhatsApp links and the analytics existence oracle. The all-day time display fix is folded into the all-day matrix row.

## 5. Highest-risk security issues

1. **SEC-01 (P2):** no CSP or security headers.
2. **SEC-02 (P2):** 30-day bearer token in `localStorage`. With no CSP, any XSS means account takeover. Server-side sanitization currently prevents stored XSS (verified).
3. **SEC-03 (P2):** no backups, restore drill, monitoring or staging.

Everything else is P3; see [SECURITY_FINDINGS.md](SECURITY_FINDINGS.md). Authorization was the strongest area: per-permission gates on every admin route (tested across 7 roles × 13 sections), 404 for hidden records, non-fillable privileged columns, role-escalation guards, and token expiry and deleted-user revocation (verified at runtime in this audit).

## 6. Broken user journeys

- **Fixed:** events listed with "when=today/week" omitted events in progress without an end time; all-day events disappeared at 06:00 on their own day; WhatsApp buttons opened invalid links for numbers without a country code.
- **None broken in the implemented scope** after the fixes. Browser runtime check covered home, business list and detail, event detail, mobile navigation at 375 px, canonical redirects and 404s.
- **Unavailable by design (MISSING):** claim a listing, save, review, submit or correct, report, owner dashboard. The UI shows honest "being built" or sign-in placeholders rather than fake functionality.

## 7. AI Data Engine reliability

Not implemented beyond the provider layer; details in [AI_DATA_ENGINE_AUDIT.md](AI_DATA_ENGINE_AUDIT.md). The Groq provider handles missing keys, HTTP errors and non-JSON responses safely without leaking the key (tested with HTTP fakes). Token budgets are configured but not enforced. No AI output can reach public tables today, because nothing calls the provider.

## 8. Database integrity

- Verified on SQLite and MariaDB: ULID keys, FKs, unique slugs, review/favourite uniqueness, rating `CHECK` (MySQL), morph-map allowlist, non-fillable status/ownership/rating columns, transactional audited writes.
- Open: no duplicate-business detection (P2); rating aggregates are never recalculated because review creation does not exist yet (P2); AI, payments, ads, notifications and locations tables are absent.

## 9. Commands executed and results

| Command | Result |
|---|---|
| `php vendor/bin/phpunit` (baseline) | OK, 123 tests / 1093 assertions |
| `php vendor/bin/phpunit tests/Feature/Audit` (before fixes) | 3 failures / 10 tests (defects confirmed) |
| `php vendor/bin/phpunit` (after fixes) | OK, 133 tests / 1141 assertions |
| `DB_CONNECTION=mysql DB_DATABASE=doonportal_test php vendor/bin/phpunit` | OK, 133 tests / 1141 assertions (MariaDB 10.4.32) |
| `php vendor/bin/pint --test` | passed |
| `npm run lint` | clean |
| `npm run build` | success |
| `npm audit` | 0 vulnerabilities |
| `composer audit` | BLOCKED (TLS error 60) |
| Browser smoke on `php artisan serve` with a seeded SQLite demo DB | pages render; statuses correct; 375 px layout correct |

## 10. Build and lint

Pint, ESLint and the Vite production build all pass before and after the audit changes. The main JS chunk is 438 kB (141 kB gzip); route-level splitting is a P3 suggestion.

## 11. Files changed during remediation

- `app/Models/Event.php`: all-day aware `phase()` and `scopeUpcomingOrLive()`; duration constants.
- `app/Services/Discovery/DiscoveryQuery.php`: date-window start uses `upcomingOrLive($from)`.
- `app/Http/Controllers/Api/V1/AnalyticsController.php`: only public entities accepted.
- `resources/js/lib/format.js`: `whatsappHref` adds the `91` country code for Indian national numbers.
- `resources/js/pages/EventDetail.jsx`, `resources/js/components/Cards.jsx`: no time shown for all-day events.
- `tests/Feature/Audit/AuditRegressionTest.php`: new, 10 tests.
- `docs/qa/*`: these reports.

## 12. Defects fixed and regression tests added

See [REMEDIATION_PLAN.md §1](REMEDIATION_PLAN.md#1-fixed-in-this-audit). Three defects have PHPUnit regression tests; the two frontend-only fixes were checked with a Node script and a static review, because the project has no frontend test runner (itself an open P3).

## 13. Outstanding blockers

- **Environment:** `composer audit` (local TLS interception); CI never run on GitHub; no staging or production environment, so backups, restore, monitoring, CORS/HTTPS and production config could not be verified.
- **Owner input:** legal operator and grievance details; choice of hosting, monitoring and (later) payment providers.

## 14. Production launch readiness

**NOT READY.** Core blueprint journeys (claims, reviews, saves, submissions, owner portal) and the AI Data Engine are not built. Backups, monitoring, staging and security headers are absent. Legal details are unfilled.

## 15. Next five actions

1. Add security-header/CSP middleware and decide on token storage (SEC-01, SEC-02).
2. Build Phase 4: claim submission, admin claim queue, owner endpoints with owner-vs-staff authorization tests.
3. Provision staging with automated backups, and run and document a restore drill; add error monitoring.
4. Add duplicate-business detection on create (shared later with AI matching).
5. Add a frontend test runner and Playwright smoke flows; push the branch so CI runs on GitHub.

## Audit notes

- Local `.env` for this worktree was created from `.env.example`. After the fast-forward it pointed at the shared MySQL dev database `doonportal`, and one `php artisan migrate --force` plus the idempotent reference seeders ran against it before this was noticed. Inspection showed no effect: all migrations were already applied (the latest batch was created about 45 minutes earlier by another session), and no row in `pages`, `roles`, `areas`, `categories` or `audit_logs` has a timestamp from the audit. `.env` was then pointed at a local SQLite file for all further runtime work. Consider making `.env.example` default to a non-shared DB name to avoid this.
- No secrets, tokens or personal data are included in these reports.
