# Implementation Status

_Last updated: 2026-10-19 · Branch `claude/phase3-admin-cms` (built on `claude/doonportal-agentic-setup-aaaa92`)_

## Summary

Phases 0–3 are **VERIFIED**: 103 PHPUnit tests (746 assertions) pass on SQLite and on MariaDB 10.4 (`DB_CONNECTION=mysql DB_DATABASE=doonportal_test php vendor/bin/phpunit`); `vendor/bin/pint --test`, `npm run lint` and `npm run build` pass. Phases 0–2 were browser-checked at 1280px and 375px. Phase 3's admin UI was browser-checked (desktop and 375px) against a separate local database with demo data, signed in as EDITOR and ADMIN test accounts: login redirect, permission-filtered navigation, list filters, business edit round-trip, business status change, event date locking + reschedule panel, collection item picker, story linked entities, user role editor (locked for administrators / self), audit log diff view, dashboard.

## Task ledger

| ID | Task | Deps | Status | Key files | Tests |
|---|---|---|---|---|---|
| P0-1 | Dependencies, env, MySQL DB | — | VERIFIED | `.env.example`, `composer.json`, `package.json` | — |
| P0-2 | `/api/v1`, JSON errors, rate limiters, guest 401 | P0-1 | VERIFIED | `bootstrap/app.php`, `routes/api.php`, `AppServiceProvider` | AuthTest, SpaRoutingTest |
| P0-3 | Sanctum auth: register/login/logout/forgot/reset/me, profile | P0-2 | VERIFIED | `Api/V1/Auth/*`, `MeController`, `Requests/Auth/*` | AuthTest (9) |
| P0-4 | RBAC tables, enums, gates, seeder | P0-1 | VERIFIED | `RoleName`, `PermissionName`, `Role`, `Permission`, `RolePermissionSeeder` | CoreEntitiesTest (policies) |
| P0-5 | AI provider abstraction (Groq + fake) | P0-1 | VERIFIED | `app/AI/*`, `config/ai.php` | GroqProviderTest (5) |
| P0-6 | CI workflow, Pint, ESLint | — | IMPLEMENTED (not yet run on GitHub) | `.github/workflows/tests.yml`, `eslint.config.js` | local runs pass |
| P1-1 | Core schema (6 migrations, ULIDs, FKs, indexes, constraints) | P0-4 | VERIFIED | `database/migrations/2026_10_19_1000*` | migrate:fresh on MariaDB; suite on SQLite + MySQL |
| P1-2 | Models, relationships, scopes, slugs | P1-1 | VERIFIED | `app/Models/*` | CoreEntitiesTest |
| P1-3 | Morph-map allowlist | P1-2 | VERIFIED | `EntityType` | CoreEntitiesTest |
| P1-4 | Status transitions + audit logging | P1-2 | VERIFIED | `StatusTransitionService`, `AuditLogger` | CoreEntitiesTest |
| P1-5 | Policies | P1-2 | VERIFIED | `app/Policies/*` | CoreEntitiesTest, DiscoveryApiTest |
| P1-6 | Reference seeders (areas, categories) + factories | P1-2 | VERIFIED | `AreaSeeder`, `CategorySeeder`, `database/factories/*` | idempotency test |
| P1-7 | Demo seeder (flagged, fictional) | P1-6 | VERIFIED | `DemoDataSeeder` | DiscoveryApiTest |
| P2-1 | Discovery query service, opening hours, search service | P1 | VERIFIED | `Services/Discovery/*`, `OpeningHours`, `Services/Search/*` | DiscoveryApiTest |
| P2-2 | Public endpoints (home, search, businesses, places, events, areas, categories, stories, collections) | P2-1 | VERIFIED | `Api/V1/*Controller`, `Http/Resources/*` | DiscoveryApiTest (14) |
| P2-3 | Analytics ingestion | P1 | VERIFIED | `AnalyticsController`, `StoreAnalyticsEventRequest` | DiscoveryApiTest |
| P2-4 | React SPA shell, routing, layout, nav (desktop + mobile) | P2-2 | VERIFIED | `resources/js/main.jsx`, `components/Layout.jsx`, `routes/web.php` | SpaRoutingTest, browser check |
| P2-5 | Pages: home, search, lists with URL filters, details, areas, explore, services, stories, collections, auth, 404 | P2-4 | VERIFIED | `resources/js/pages/*` | lint, build, browser check |
| P2-6 | SEO metadata, canonical, JSON-LD (non-demo, real fields only) | P2-5 | IMPLEMENTED | `hooks/useMeta.js`, detail pages | manual; SSR pending (Phase 9) |
| P3-1 | `/api/v1/admin/*` routes: `auth:sanctum` + `admin.access` + per-section permission gates; id (ULID) binding; soft delete/restore | P1 | VERIFIED | `routes/api.php`, `AppServiceProvider` (gates), `Api/V1/Admin/AdminController` | AdminAuthorizationTest (7 roles × 13 sections, read + write) |
| P3-2 | Form Requests for businesses (hours, services, social links, categories, areas), places, events, venues, organizers, stories, collections (+ items), areas, categories | P3-1 | VERIFIED | `app/Http/Requests/Admin/*` | BusinessAdminTest, EventAdminTest, EditorialAdminTest |
| P3-3 | Status endpoints via `StatusTransitionService`: business verification, event publish/cancel-with-reason/archive, reschedule keeping `original_starts_at`, publication workflow for places/stories/collections | P3-1 | VERIFIED | `StatusTransitionService`, `PublicationStatus` | EventAdminTest, EditorialAdminTest, BusinessAdminTest |
| P3-4 | Audit trail for every admin change (changed fields only; no-op not logged) | P3-1 | VERIFIED | `AdminController::saveAudited()`, `AuditLogger` | all admin tests assert audit rows |
| P3-5 | User/role management with escalation guards | P3-1 | VERIFIED | `Admin/UserController`, `UserRolesRequest` | RoleManagementTest (8) |
| P3-6 | Media upload service (content-sniffed MIME, size/dimension limits, server file names, public disk) | P3-1 | VERIFIED | `MediaService`, `Admin/MediaController` | MediaAuditDashboardTest |
| P3-7 | Server-side HTML sanitizer for story bodies | — | VERIFIED | `HtmlSanitizer` (symfony/html-sanitizer) | HtmlSanitizerTest (12), EditorialAdminTest |
| P3-8 | Audit-log listing (filters) and dashboard counts | P3-4 | VERIFIED | `Admin/AuditLogController`, `Admin/DashboardController` | MediaAuditDashboardTest |
| P3-9 | React admin under `/admin` (lazy chunk): guard from `/auth/me`, dashboard, list/edit screens with filters + pagination for all CMS resources, status/reschedule/items panels, media library, users & roles, audit log | P3-1–8 | VERIFIED | `resources/js/admin/*`, `main.jsx`, `Layout.jsx`, `pages/Auth.jsx` (`?next=`) | lint, build, browser check |

## Known issues / limitations

| Severity | Issue |
|---|---|
| Medium | SPA renders metadata client-side; crawlers that do not run JS see only the shell. Planned for Phase 9. |
| Medium | Auth token stored in `localStorage` (see security checklist). |
| Low | `php artisan serve` is single-threaded; parallel API calls queue up locally. Use Apache/XAMPP vhost or `PHP_CLI_SERVER_WORKERS` for faster local browsing. |
| Low | Home map preview is a static scatter of markers, not an interactive map (Phase 7). |
| Low | Saved, reviews, submissions, claims and corrections are UI placeholders (Phases 4–5). Admin dashboard shows their queue sizes but there are no moderation screens yet. |
| Low | Admin relation selects (areas, categories, venues, organizers, linked business/place) load the first 100 options; a searchable picker is needed once any list grows past that (the UI says when it is truncated). |
| Low | Uploaded images are stored as-is (no resizing, re-encoding or EXIF stripping — GD/Imagick not available locally). |
| Low | Business sub-records (hours, services, social links, facilities, story links) are replaced wholesale on save; fine for admin editing, revisit if owners edit concurrently (Phase 4). |
| Info | Story bodies are edited as raw HTML (sanitized on save, preview shown after saving); a rich-text editor is a Phase 6 item. |
| Info | Local XAMPP PHP has no CA bundle that trusts Norton's TLS scanning; `composer require` needed `COMPOSER_CAFILE` pointing at a bundle that includes the Norton root. |
| Info | Skeleton Laravel workflows (`issues.yml`, `pull-requests.yml`, `update-changelog.yml`) and `CHANGELOG.md` remain from the starter; remove if unused. |

## Environment variables

`DB_*` (MySQL), `APP_URL` (builds media URLs on the `public` disk; run `php artisan storage:link` once), `AI_PROVIDER`, `GROQ_API_KEY` (not needed until Phase 14), `GROQ_MODEL`, `GROQ_BASE_URL`, `AI_TIMEOUT_SECONDS`, `AI_DAILY_TOKEN_BUDGET`, `AI_MONTHLY_TOKEN_BUDGET`, `MAIL_*` for password reset emails.

## Next action

Phase 4 — Business owner portal, starting with claim submission and the admin claim queue (see [implementation-roadmap.md](implementation-roadmap.md)).
