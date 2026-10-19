# Architecture

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Laravel 12 (PHP 8.2+) | REST API under `/api/v1` |
| Auth | Laravel Sanctum personal access tokens | SPA stores the token in `localStorage` (see security checklist) |
| Database | MySQL / MariaDB now; PostgreSQL target | Schema and queries kept portable (see Decisions) |
| Frontend | React 19 + React Router 7, Vite 7, Tailwind CSS 4 | Single-page app served by Laravel |
| AI | Groq (OpenAI-compatible) behind `App\AI\AIProvider` | Only scaffolding so far; engine is Phase 14 |
| Tests | PHPUnit (SQLite in-memory by default; MySQL in CI), ESLint | |

## Request flow

```
Browser ──► Laravel web route `/{path?}` ──► resources/views/app.blade.php (SPA shell)
   │                                              │
   └── React Router renders page ──► api/client.js (axios, Bearer token)
                                          │
                                          ▼
                     routes/api.php  /api/v1/*  (throttle:api)
                                          │
              Form Request (validation, allowlisted sort/per_page)
                                          │
              Controller (thin) ──► Policy via ensureVisible() → 404 for hidden records
                                          │
              Services: DiscoveryQuery, SearchService, OpeningHours,
                        StatusTransitionService, AuditLogger
                                          │
              Eloquent models (ULIDs, enforced morph map) ──► DB
                                          │
              API Resources (public field allowlist) ──► JSON
```

## Code layout

```
app/
  AI/                    AIProvider interface, AIResponse, GroqProvider, FakeProvider
  Enums/                 Roles, permissions, statuses, entity types (morph allowlist), analytics names
  Exceptions/            InvalidStatusTransition (renders 409)
  Http/Controllers/Api/V1/  Auth, Me, Home, Search, Business, Place, Event, Area, Category, Story, Collection, Analytics
  Http/Requests/         Auth + profile + discovery list requests (ListRequest base)
  Http/Resources/        Public representations; never expose owner ids, metadata or private fields
  Models/                Domain models; Concerns/HasUniqueSlug, Concerns/NormalizesTimes
  Policies/              Visibility + write permissions per entity
  Services/              AuditLogger, StatusTransitionService, OpeningHours, Discovery/*, Search/*
resources/js/
  api/client.js          axios instance, token storage, error helpers
  hooks/                 useApi (fetch + cancel), useMeta (title/canonical/JSON-LD)
  components/            Layout, Cards, Listing (filters/pagination), Detail, States, Badges, Icons
  pages/                 One file per route group
```

## Key mechanisms

- **Visibility.** Each model has a `public()` scope and `isPublic()`; policies combine it with permissions/ownership. Detail endpoints call `ensureVisible()` which returns 404 (not 403) so hidden records are indistinguishable from missing ones.
- **Status changes** for businesses and events only go through `StatusTransitionService`: transitions are allowlisted in the enums, wrapped in a transaction and audited. `status`, `verified_at`, `owner_id` and rating aggregates are not mass assignable.
- **Event lifecycle.** Stored statuses are `DRAFT, SUBMITTED, REVIEW, PUBLISHED, CANCELLED, ARCHIVED`. `UPCOMING / LIVE / COMPLETED` are derived from `starts_at`/`ends_at` (`Event::phase()`), so no cron job has to keep them in sync. Rescheduling is recorded with `original_starts_at`. Publishing validates start date, chronology, time zone and a plausibility window (≤ 548 days ahead) to catch wrong-year data.
- **Opening hours** are local wall-clock times (Asia/Kolkata) stored as zero-padded `HH:MM:SS`; overnight slots (closes < opens) and per-date exceptions are supported both in SQL (`open_now` filter) and in PHP (`open_now` field). A business with no hours reports `open_now: null` (unknown), never "closed".
- **Polymorphism.** `Relation::enforceMorphMap(EntityType::morphMap())` — any model outside the allowlist throws. API inputs that name entity types are validated against `EntityType` subsets.
- **Search** goes through `SearchService` (bound to `DatabaseSearchService`, case-insensitive `LIKE` with escaped wildcards). Swappable for PostgreSQL full-text or Meilisearch in Phase 10.
- **Home feed** is cached for 5 minutes (`api.v1.home`). Every section is live data; empty arrays render empty states.
- **Demo data** (`DemoDataSeeder`) is opt-in, refuses to run in production, and every record carries `metadata.demo = true`, which the API exposes as `is_demo` and the UI badges as "Demo data". Demo records are UNVERIFIED and contain no phone numbers.

## Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | MySQL/MariaDB instead of PostgreSQL for now | Local XAMPP environment has MariaDB 10.4; `pdo_pgsql` is disabled. Schema uses only portable features (ULIDs, `json`, standard indexes; CHECK constraint skipped on SQLite) and the suite runs on SQLite + MySQL, so moving to PostgreSQL is a config change plus a test run. |
| D2 | React SPA inside the Laravel app | One repo and deploy. SEO metadata is set client-side for now; server-side rendering / prerendering is a Phase 9 item. |
| D3 | Sanctum bearer tokens (not cookie sessions) | Same flow for SPA and future mobile apps. Tokens expire after 30 days and are revoked on password reset. |
| D4 | Derived event phases | Avoids status drift and scheduled writes. |
| D5 | Monetization, notifications and `ai_*` tables deferred | Built in their own phases (8, 11, 14) to avoid speculative schema. |
| D6 | `locations` table not created | Coordinates live on businesses, places, venues and areas; a shared table adds joins without a current use. Revisit with the map phase. |
| D7 | DOMPurify on story bodies | Defence in depth until the editorial CMS sanitizes HTML server-side (Phase 6). |
