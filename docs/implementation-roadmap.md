# Implementation Roadmap

Live status per task: [implementation-status.md](implementation-status.md).

| Phase | Name | Status | Depends on |
|---|---|---|---|
| 0 | Foundation | VERIFIED | — |
| 1 | Database & core entities | VERIFIED | 0 |
| 2 | Public website & discovery | VERIFIED | 1 |
| 3 | Admin panel & CMS | VERIFIED | 1 |
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

## Recommended next phase: 4 — Business owner portal

Why next: the admin API, audit trail, media uploads and the permission model now exist, so claim review (the moderation primitive that links `businesses.owner_id`) can be built on them, and Phase 8 (monetization) depends on owners.

Scope:
1. Claim submission (`POST /businesses/{slug}/claims`) with evidence, rate limits and duplicate protection.
2. Admin claim queue under `/api/v1/admin/claims` (permission `claims.manage`): approve / reject / needs-info through a status service; approval sets `owner_id`, grants BUSINESS_OWNER and moves the business to CLAIMED; every step audited.
3. Owner endpoints (`/me/businesses/*`) reusing `BusinessRequest` rules for the fields owners may edit (no status, verification or publication flags); owner edits audited.
4. React owner portal at `/business-portal` and an admin "Claims" screen (reuse `resources/js/admin`).

Acceptance: an owner can only edit businesses linked by an approved claim; claim decisions are audited; authorization tests cover owner vs. non-owner vs. staff.

Phase 3 delivered (see implementation-status): `/api/v1/admin/*` CRUD for businesses (hours, services, social links, categories, areas), places, events, venues, organizers, stories, collections (+ ordered items), areas and categories; status endpoints via `StatusTransitionService` (incl. publication workflow and rescheduling); role management with escalation guards; media uploads; server-side story HTML sanitizer; audit-log listing; dashboard; React admin at `/admin`.

## Phase notes carried forward

- Phase 7 should decide on a `locations` table (architecture decision D6) and a map provider abstraction.
- Phase 9: SPA SEO needs server rendering or prerendering for crawlers, a sitemap, and Open Graph images.
- Phase 10: switch `SearchService` binding to PostgreSQL FTS (after the DB move) or Meilisearch when justified.
- Phase 5/6: moderation screens for reviews, submissions and reports can reuse the admin list/edit components and `AdminController` helpers; the dashboard already reports their queue sizes.
- Phase 12: revisit token storage (`localStorage` → httpOnly cookie via Sanctum SPA auth) and add security headers/CSP.

## Agent operating rules (from the blueprint)

- Inspect before changing; preserve working code and data; no destructive migrations or production data changes without explicit approval.
- Migrations for schema; Form Requests, Policies, API Resources, services; transactions for multi-step changes; queues for slow/external work; idempotent jobs.
- No hard-coded secrets; never expose credentials, prompts or private data.
- Never fabricate businesses, reviews, hours, events or verification; demo data is always flagged.
- AI output never bypasses validation, authorization or domain services.
- A phase is VERIFIED only when its tests, lint and build pass and acceptance criteria are checked; report files changed, migrations, APIs, pages, test results, env vars, security notes, open issues and next task.
- Ask before: deleting/irreversibly modifying production data, paid services, real payment collection, publishing sensitive/high-risk info without rules, security-sensitive production config.
