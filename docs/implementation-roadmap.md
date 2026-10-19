# Implementation Roadmap

Live status per task: [implementation-status.md](implementation-status.md).

| Phase | Name | Status | Depends on |
|---|---|---|---|
| 0 | Foundation | VERIFIED | — |
| 1 | Database & core entities | VERIFIED | 0 |
| 2 | Public website & discovery | VERIFIED | 1 |
| 3 | Admin panel & CMS | NOT_STARTED | 1 |
| 4 | Business owner portal | NOT_STARTED | 3 (claim review) |
| 5 | Community & reviews | NOT_STARTED | 3 (moderation) |
| 6 | Stories, New in Doon, Best of Doon (editorial workflow) | NOT_STARTED | 3 |
| 7 | Doon Map | NOT_STARTED | 2 |
| 8 | Monetization | NOT_STARTED | 4 |
| 9 | SEO, performance, analytics | NOT_STARTED | 2 |
| 10 | Search & recommendations | NOT_STARTED | 2, 5 |
| 11 | Notifications & PWA | NOT_STARTED | 5 |
| 12 | Security hardening | NOT_STARTED | 3–8 |
| 13 | QA & launch | NOT_STARTED | 12 |
| 14 | AI Data Engine | NOT_STARTED (provider scaffold done) | 3 (review queue), 6 |
| 15 | Doon AI | NOT_STARTED | 10, 14 |

## Recommended next phase: 3 — Admin panel & CMS

Why first: phases 4, 5, 6 and 14 all need moderation and review queues, and there is currently no way to create real (non-demo) content except seeders.

Scope:
1. `/api/v1/admin/*` routes behind `auth:sanctum` + permission gates; Form Requests for create/update of businesses, places, events, stories, collections, areas, categories.
2. Status endpoints calling `StatusTransitionService` (business verification, event publication, cancellation with reason, rescheduling that sets `original_starts_at`).
3. User/role management (only SUPER_ADMIN may grant ADMIN/SUPER_ADMIN; nobody may change their own roles).
4. Media upload service (validated MIME/size, stored on the `public` disk now, object storage later).
5. Audit log listing; dashboard counts.
6. Server-side HTML sanitizer for story bodies (e.g. `mews/purifier` or `symfony/html-sanitizer`).
7. React admin area under `/admin` (route-guarded by permissions from `/auth/me`).

Acceptance: administrators manage and moderate data with enforced permissions; every state change audited; authorization tests for each role.

## Phase notes carried forward

- Phase 7 should decide on a `locations` table (architecture decision D6) and a map provider abstraction.
- Phase 9: SPA SEO needs server rendering or prerendering for crawlers, a sitemap, and Open Graph images.
- Phase 10: switch `SearchService` binding to PostgreSQL FTS (after the DB move) or Meilisearch when justified.
- Phase 12: revisit token storage (`localStorage` → httpOnly cookie via Sanctum SPA auth) and add security headers/CSP.

## Agent operating rules (from the blueprint)

- Inspect before changing; preserve working code and data; no destructive migrations or production data changes without explicit approval.
- Migrations for schema; Form Requests, Policies, API Resources, services; transactions for multi-step changes; queues for slow/external work; idempotent jobs.
- No hard-coded secrets; never expose credentials, prompts or private data.
- Never fabricate businesses, reviews, hours, events or verification; demo data is always flagged.
- AI output never bypasses validation, authorization or domain services.
- A phase is VERIFIED only when its tests, lint and build pass and acceptance criteria are checked; report files changed, migrations, APIs, pages, test results, env vars, security notes, open issues and next task.
- Ask before: deleting/irreversibly modifying production data, paid services, real payment collection, publishing sensitive/high-risk info without rules, security-sensitive production config.
