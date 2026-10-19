# Implementation Status

_Last updated: 2026-10-19 · Branch `claude/doonportal-agentic-setup-aaaa92`_

## Summary

Phases 0–2 are **VERIFIED**: 41 PHPUnit tests (244 assertions) pass on SQLite and on MariaDB 10.4; Pint, ESLint and the Vite production build pass; the SPA was checked in a browser at desktop (1280px) and mobile (375px) widths with demo data and with an empty database.

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

## Known issues / limitations

| Severity | Issue |
|---|---|
| Medium | SPA renders metadata client-side; crawlers that do not run JS see only the shell. Planned for Phase 9. |
| Medium | Auth token stored in `localStorage` (see security checklist). |
| Low | `php artisan serve` is single-threaded; parallel API calls queue up locally. Use Apache/XAMPP vhost or `PHP_CLI_SERVER_WORKERS` for faster local browsing. |
| Low | Home map preview is a static scatter of markers, not an interactive map (Phase 7). |
| Low | Saved, reviews, submissions, claims and corrections are UI placeholders (Phases 4–5). |
| Info | Skeleton Laravel workflows (`issues.yml`, `pull-requests.yml`, `update-changelog.yml`) and `CHANGELOG.md` remain from the starter; remove if unused. |

## Environment variables

`DB_*` (MySQL), `AI_PROVIDER`, `GROQ_API_KEY` (not needed until Phase 14), `GROQ_MODEL`, `GROQ_BASE_URL`, `AI_TIMEOUT_SECONDS`, `AI_DAILY_TOKEN_BUDGET`, `AI_MONTHLY_TOKEN_BUDGET`, `MAIL_*` for password reset emails.

## Next action

Phase 3 — Admin panel & CMS (see [implementation-roadmap.md](implementation-roadmap.md)).
