# Implementation Status

_Last updated: 2026-10-19 · Branch `claude/phase3-admin-cms` (built on `claude/doonportal-agentic-setup-aaaa92`)_

## Summary

Phases 0–3 are **VERIFIED**: 123 PHPUnit tests (1093 assertions) pass on SQLite and on MariaDB 10.4 (`DB_CONNECTION=mysql DB_DATABASE=doonportal_test php vendor/bin/phpunit`); `vendor/bin/pint --test`, `npm run lint` and `npm run build` pass. Phases 0–2 were browser-checked at 1280px and 375px. Phase 3's admin UI was browser-checked (desktop and 375px) against a separate local database with demo data, signed in as EDITOR and ADMIN test accounts: login redirect, permission-filtered navigation, list filters, business edit round-trip, business status change, event date locking + reschedule panel, collection item picker, story linked entities, user role editor (locked for administrators / self), audit log diff view, dashboard.

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
| P3-10 | Change password for the signed-in user (`PUT /me/password`) + admin "My account" page | P0-3 | VERIFIED | `MeController::updatePassword`, `ChangePasswordRequest`, `resources/js/admin/pages/Account.jsx` | ChangePasswordTest (3), browser check |
| P3-11 | Admin redesign: grouped, collapsible left menu (Overview, Directory, Events, Content, Monetization, Marketing & SEO, Administration), permission-filtered, mobile drawer | P3-17 | Editable site pages (privacy, terms, cookies, disclaimer, community guidelines, about, contact) with legal-detail placeholders; Legal details settings; footer links; sign-up notice | P3-12 | VERIFIED | `Page`, `PageRenderer`, `SitePagesSeeder`, `Api/V1/PageController`, `Admin/PageController`, `pages/SitePage.jsx` | SitePagesTest (5), browser check |
| P3-18 | Cookie-consent banner gating GA4, Tag Manager, Clarity and Meta Pixel by category; Cookie settings in footer | P3-14 | VERIFIED | `lib/consent.js`, `components/CookieBanner.jsx`, `SpaController` | SitePagesTest, SpaRoutingTest, browser check (accept → loads, reject → removed) |
| P3-9 | VERIFIED | `resources/js/admin/menu.js`, `AdminApp.jsx` | lint, build, browser (desktop + 375px) |
| P3-12 | Server-rendered SEO for every public URL, real 404s, canonical 301s, `/robots.txt`, `/sitemap.xml`, `/api/v1/seo` + client `SeoManager` | P2 | VERIFIED | `Services/Seo/*`, `SpaController`, `SeoFilesController`, `components/SeoManager.jsx` | SpaRoutingTest (8) |
| P3-13 | SEO management: settings, page/record overrides, preview, audit; Search & sharing panel on record edit screens | P3-12 | VERIFIED | `Admin/SeoController`, `Admin/SettingsController`, `SiteSettings`, `admin/pages/Seo.jsx`, `components/SeoBits.jsx` | MarketingAdminTest |
| P3-14 | Social media profiles (footer + sameAs) and tracking codes (GA4, GTM, Meta Pixel, Clarity, Google/Bing verification) | P3-12 | VERIFIED | `SiteSettings`, `app.blade.php`, `admin/pages/Settings.jsx` | MarketingAdminTest, SpaRoutingTest |
| P3-15 | Monetization (manual): plans, subscriptions, revenue report; dashboard cards | P3-1 | VERIFIED | `Plan`, `Subscription`, `Admin/PlanController`, `Admin/SubscriptionController`, `Admin/RevenueController`, `admin/pages/Revenue.jsx` | MarketingAdminTest |
| P3-16 | First-party analytics report + `page_view` tracking | P2-3 | VERIFIED | `Admin/AnalyticsReportController`, `admin/pages/Analytics.jsx` | MarketingAdminTest |
| P3-9 | React admin under `/admin` (lazy chunk): guard from `/auth/me`, dashboard, list/edit screens with filters + pagination for all CMS resources, status/reschedule/items panels, media library, users & roles, audit log | P3-1–8 | VERIFIED | `resources/js/admin/*`, `main.jsx`, `Layout.jsx`, `pages/Auth.jsx` (`?next=`) | lint, build, browser check |
| P4-1 | Member account area `/account` (lazy chunk): overview, profile (mobile number with country code, address), saved, my reviews, my businesses, sign-in & security | P0-3 | VERIFIED | `pages/account/*`, `MeController`, `UpdateProfileRequest`, `Support/PhoneNumber`, `resources/data/countries.json` | AccountTest, browser check (desktop + 375px) |
| P4-2 | Sign in with Google (ID token checked with Google tokeninfo; same-email accounts linked; unverified accounts lose their password on link), link Google from Security, set a password for Google-only accounts | P0-3 | VERIFIED | `AuthController::google`, `MeController::linkGoogle`, `Services/Auth/GoogleIdTokenVerifier`, `components/GoogleButton.jsx`, CSP in `SecurityHeaders` | GoogleLoginTest |
| P4-3 | Ownership claims: claim form on listings, member's claims list/cancel, staff queue with approve/reject (owner linked, BUSINESS_OWNER role, verified to claimed, rival claims closed) | P1 | VERIFIED | `Services/Community/ClaimService`, `Account/ClaimController`, `Admin/ClaimController`, `components/ClaimListing.jsx`, `admin/pages/Moderation.jsx` | OwnershipTest |
| P4-4 | Add a business: member submission, staff approval publishes it with the member as owner (possible duplicates shown) | P4-3 | VERIFIED | `SubmissionService`, `Account/SubmissionController`, `Admin/SubmissionController`, `pages/account/AddBusiness.jsx` | OwnershipTest |
| P4-5 | Owner edits wait for staff approval: only changed fields stored, one pending proposal per listing, live-vs-proposed review screen, applied through the same `BusinessWriter` as admin edits | P4-3 | VERIFIED | `OwnerEditService`, `BusinessWriter`, `AuditedWriter`, `Account/OwnerBusinessController`, `pages/account/ManageBusiness.jsx` | OwnerToolsTest |
| P4-6 | Owner stats (views, calls, WhatsApp, directions, website, saves, offers; daily views) and public replies to reviews | P4-3 | VERIFIED | `OwnerBusinessController::stats/reply` | OwnerToolsTest, ReviewsAndSavedTest |
| P4-7 | Reviews: members write/edit/delete, moderation queue (publish/reject/hide, not own), rating aggregates from published reviews only | P1 | VERIFIED | `ReviewService`, `Account/ReviewController`, `Admin/ReviewController`, `components/Reviews.jsx` | ReviewsAndSavedTest |
| P4-8 | Saved businesses, places, events and stories (heart buttons, saved list) | P1 | VERIFIED | `Account/SavedController`, `context/SavedContext.jsx` | ReviewsAndSavedTest |

## Known issues / limitations

| Severity | Issue |
|---|---|
| Medium | SPA renders metadata client-side; crawlers that do not run JS see only the shell. Planned for Phase 9. |
| Medium | Auth token stored in `localStorage` (see security checklist). |
| Low | `php artisan serve` is single-threaded; parallel API calls queue up locally. Use Apache/XAMPP vhost or `PHP_CLI_SERVER_WORKERS` for faster local browsing. |
| Low | Home map preview is a static scatter of markers, not an interactive map (Phase 7). |
| Low | Corrections from members and reports are still placeholders; owners cannot upload photos, logo or cover yet (staff can). |
| Low | Phone numbers are checked against a bundled country list (dial codes, mobile patterns for common countries), not libphonenumber; numbers are not verified by SMS. |
| Low | No emails are sent when a claim, listing or edit is approved or rejected; members see the outcome and any note in their account. |
| Low | Admin relation selects (areas, categories, venues, organizers, linked business/place) load the first 100 options; a searchable picker is needed once any list grows past that (the UI says when it is truncated). |
| Low | Uploaded images are stored as-is (no resizing, re-encoding or EXIF stripping — GD/Imagick not available locally). |
| Low | Business sub-records (hours, services, social links, facilities, story links) are replaced wholesale on save; fine for admin editing, revisit if owners edit concurrently (Phase 4). |
| Medium | Fill in Admin → Legal details (operator, contact, grievance officer) and have the legal pages reviewed by a lawyer before launch; until then they show “(to be published)”. |
| Low | Page bodies are still rendered client-side; metadata, status codes and structured data are server-side. Full prerendering remains a Phase 9 item. |
| Low | Revenue is from manually recorded payments; there is no payment gateway, invoicing or GST handling yet (Phase 8). |
| Info | Story bodies are edited as raw HTML (sanitized on save, preview shown after saving); a rich-text editor is a Phase 6 item. |
| Info | Local XAMPP PHP has no CA bundle that trusts Norton's TLS scanning; `composer require` needed `COMPOSER_CAFILE` pointing at a bundle that includes the Norton root. |
| Info | Skeleton Laravel workflows (`issues.yml`, `pull-requests.yml`, `update-changelog.yml`) and `CHANGELOG.md` remain from the starter; remove if unused. |

## Environment variables

`DB_*` (MySQL), `APP_URL` (builds media URLs on the `public` disk; run `php artisan storage:link` once), `AI_PROVIDER`, `GROQ_API_KEY` (not needed until Phase 14), `GROQ_MODEL`, `GROQ_BASE_URL`, `AI_TIMEOUT_SECONDS`, `AI_DAILY_TOKEN_BUDGET`, `AI_MONTHLY_TOKEN_BUDGET`, `MAIL_*` for password reset emails, `GOOGLE_CLIENT_ID` (optional; Sign in with Google is hidden without it).

## Next action

Phase 4 follow-ups: owner photo/logo uploads, emails on claim/listing/edit decisions, member corrections and reports (see [implementation-roadmap.md](implementation-roadmap.md)).
