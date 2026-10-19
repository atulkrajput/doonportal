# Remediation Plan

_Audit date: 2026-10-20 · Severity scale: P0 critical breach / data loss · P1 broken critical journey, serious authz, unsafe publication · P2 important gap · P3 minor._

There are **no open P0 or P1 defects**. Every defect found in implemented code was fixed in this audit (section 1). What remains is hardening, launch infrastructure and unbuilt product scope.

## 1. Fixed in this audit

| Defect | Sev | Files | Regression test |
|---|---|---|---|
| All-day events without an end showed COMPLETED and dropped out of listings and sitemap at 06:00 on the day | P2 | `app/Models/Event.php` (`phase`, `scopeUpcomingOrLive`, duration constants) | `AuditRegressionTest::test_all_day_events_without_an_end_last_the_whole_local_day` |
| All-day events displayed "12:00 am" | P3 | `resources/js/pages/EventDetail.jsx`, `resources/js/components/Cards.jsx` | Static only (no frontend test runner) |
| Date-window filters (`today`, `week`, …) dropped events in progress without an end time | P2 | `app/Services/Discovery/DiscoveryQuery.php` | `AuditRegressionTest::test_date_window_filters_keep_events_that_are_live_now` |
| WhatsApp links missing the country code for 10-digit and 0-prefixed numbers | P3 | `resources/js/lib/format.js` (`whatsappHref`) | Node check (5 inputs); add a Vitest test once a runner exists |
| Analytics endpoint revealed whether hidden record IDs exist and recorded events for them | P3 | `app/Http/Controllers/Api/V1/AnalyticsController.php` | `AuditRegressionTest::test_analytics_does_not_reveal_whether_hidden_records_exist` |

## 2. Implementation defects still open (routine, reversible)

Ordered by priority. None needs a destructive migration.

| # | Item | Sev | Depends on | Notes |
|---|---|---|---|---|
| 1 | Security-header middleware (CSP report-only first, HSTS, nosniff, Referrer-Policy, frame-ancestors) | P2 | — | SEC-01 |
| 2 | Token storage: Sanctum SPA cookie auth, or a shorter lifetime plus CSP | P2 | 1 | SEC-02; touches `api/client.js` and auth controllers |
| 3 | Duplicate-business check on create (normalized name + phone/coordinates within a radius) and an admin warning | P2 | — | Also a prerequisite for AI matching |
| 4 | Sanitize `Story::body` and `Page::body` at the model layer | P3 | — | SEC-06 |
| 5 | Restrict CORS to `APP_URL` | P3 | — | SEC-05 |
| 6 | Constant-time login for unknown emails | P3 | — | SEC-04 |
| 7 | Invalidate the sitemap cache on publish/unpublish | P3 | — | Matrix Q |
| 8 | Groq retry only on connection errors, 429 and 5xx | P3 | — | SEC-09 |
| 9 | Re-encode uploads and strip EXIF | P3 | GD/Imagick on the server | SEC-07 |
| 10 | Frontend test runner (Vitest) plus Playwright smoke flows | P2/P3 | — | Covers `format.js`, consent, the event date display fix |
| 11 | Remove the starter GitHub workflows and `CHANGELOG.md` if unused | P3 | — | — |

## 3. Environment and launch blockers (need owner decisions or infrastructure)

| Item | Why blocked | Owner action |
|---|---|---|
| Staging environment | Not provisioned | Choose hosting; create staging with separate DB, mail and storage |
| Backups and restore drill | No production or staging DB | Automated backups; perform and document a restore on staging |
| Error monitoring and uptime | No service chosen | Pick a provider (paid services need approval) |
| CI run on GitHub | Branch not pushed | Push and confirm `.github/workflows/tests.yml` |
| `composer audit` | Local TLS interception (curl error 60) | Run in CI or set `COMPOSER_CAFILE` |
| Legal details and legal review | Business information only the operator has | Fill Admin → Legal details; lawyer review |

## 4. Missing product scope (roadmap phases, not defects)

Recommended order, following the dependencies in `docs/implementation-roadmap.md`:

1. **Phase 4: owner portal and claims.** Claim submission, admin claim queue, owner endpoints. Unblocks the "owners manage only their businesses" scenario.
2. **Phase 5: community.** Favourites, reviews with transactional aggregate recalculation, submissions/corrections/reports, moderation queues.
3. **Phase 12: security hardening.** Items 1–2 above can land earlier.
4. **Phase 13: QA and launch.** Staging, backups, monitoring, E2E suite.
5. **Phase 14: AI Data Engine.** Budget ledger first, then sources → validation → matching → scoring → review queue (see [AI_DATA_ENGINE_AUDIT.md](AI_DATA_ENGINE_AUDIT.md)).
6. Phases 6–11 and 15 as planned.

## 5. Acceptance for re-audit

- All P2 items in section 2 closed with tests.
- Section 3 blockers resolved with evidence (restore log, monitoring alert test, green CI run).
- Phase 4 and 5 journeys covered by feature tests and at least one Playwright flow each.
