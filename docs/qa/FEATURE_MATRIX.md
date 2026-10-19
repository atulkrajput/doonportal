# Feature Matrix

_Audit date: 2026-10-20 · Branch audited: `claude/phase3-admin-cms` @ `c79c59f` (fast-forwarded into `claude/doonportal-feature-audit-05571e`) · See [MASTER_AUDIT_REPORT.md](MASTER_AUDIT_REPORT.md)._

**Evidence labels:** **RT** = runtime-verified (test executed or exercised in a browser/HTTP during this audit) · **ST** = statically inspected only.
Test names refer to PHPUnit methods; all suites were executed on SQLite (in-memory) and MariaDB 10.4 (`doonportal_test`) in this audit unless noted.
"Fixed" in the Defect column means the defect was found and fixed during this audit, with a regression test.

## A. Foundation and architecture

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| `/api/v1` REST API with JSON `{message, errors}` errors | PASS | RT. `bootstrap/app.php` `shouldRenderJsonWhen`; unknown API paths return JSON 404 | `SpaRoutingTest::test_unknown_api_paths_return_json_not_the_spa`, `AuditRegressionTest::test_server_errors_do_not_expose_stack_traces_when_debug_is_off` | — | — | — |
| React SPA shell, routing and server-rendered status codes | PASS | RT. `SpaController`, `routes/web.php`; browser: `/`, `/businesses`, `/business/{slug}`, `/event/{slug}` → 200, unknown record → 404, `/Businesses/` → 301 | `SpaRoutingTest` (8) | — | — | — |
| Code style and lint (Pint, ESLint) | PASS | RT. `vendor/bin/pint --test` passed; `npm run lint` clean | — | — | — | — |
| Production frontend build | PASS | RT. `npm run build` (Vite 7.3.7): main 438 kB / admin chunk 105 kB | — | — | — | Consider route-level code splitting for the 438 kB main chunk (P3) |
| CI pipeline (`.github/workflows/tests.yml`) | BLOCKED | ST. Matrix PHP 8.2/8.3 × SQLite/MySQL 8 + frontend job defined; never run on GitHub per `docs/implementation-status.md` | Equivalent commands run locally | Unverified on GitHub | P3 | Push the branch and confirm the workflow passes |
| Starter workflows (`issues.yml`, `pull-requests.yml`, `update-changelog.yml`, `CHANGELOG.md`) | PARTIAL | ST. Laravel skeleton leftovers | — | Noise, may act on issues/PRs unexpectedly | P3 | Remove if unused |
| Queue workers and scheduler | MISSING | ST. `routes/console.php` only has `inspire`; no jobs in `app/Jobs`; no `Schedule` entries | — | No background processing exists | P2 (needed by Phase 14) | Add when AI engine/notifications land |
| Error monitoring and alerting | MISSING | ST. No Sentry/Bugsnag/health alerting; `/up` health route only | — | — | P2 | Add error tracking + uptime checks before launch |

## B. Database schema, relationships and integrity

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Core schema: ULID keys, FKs, unique slugs, indexes | PASS | RT. 13 migrations applied on SQLite and MariaDB 10.4 via RefreshDatabase | Whole suite on both DBs | — | — | — |
| One review / one favourite per user per entity | PASS | RT. Unique `(user_id, reviewable_type, reviewable_id)` and favourites equivalent | `CoreEntitiesTest::test_one_review_and_one_favorite_per_user_per_entity` | — | — | — |
| Review rating 1–5 DB constraint | PASS | RT on MariaDB. `CHECK (rating BETWEEN 1 AND 5)` added on MySQL only | Suite on MariaDB | SQLite has no CHECK (app-level only) | P3 | Acceptable; keep Form Request validation when reviews ship |
| Controlled polymorphic types (morph map) | PASS | RT. `Relation::enforceMorphMap(EntityType::morphMap())` | `CoreEntitiesTest::test_polymorphic_types_use_the_allowlisted_aliases`, `test_models_outside_the_morph_map_are_rejected` | — | — | — |
| Protected columns not mass-assignable (status, owner_id, ratings) | PASS | RT. `$fillable` excludes them | `BusinessAdminTest::test_protected_fields_cannot_be_set_through_create_or_update`, `CoreEntitiesTest::test_business_status_is_not_mass_assignable` | — | — | — |
| Transactions for multi-step writes | PASS | RT/ST. `AdminController::saveAudited`, `StatusTransitionService`, `MediaService` (deletes file on rollback) | Admin suites | — | — | — |
| Rating aggregate consistency (`rating_avg`, `rating_count`) | MISSING | ST. No code recalculates aggregates; values only set by `DemoDataSeeder` | — | Aggregates will drift once reviews exist | P2 | Recalculate in a transaction on review publish/unpublish/delete |
| AI engine tables (`ai_sources` … `ai_content_changes`) | MISSING | ST. Planned in `docs/ai-data-engine.md`; no migrations | — | — | P2 | Phase 14 |
| Monetization tables `features`, `plan_features`, `payments`, `advertisements` | MISSING | ST. Only `plans`, `subscriptions` exist | — | — | P3 | Phase 8 |
| `notifications`, `locations` tables | MISSING | ST | — | — | P3 | Phases 7 and 11 |

## C. Authentication and authorization

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Register / login / logout / me (Sanctum tokens, 30-day expiry) | PASS | RT. `Auth\AuthController` | `AuthTest` (9) | — | — | — |
| Forgot / reset password without account enumeration | PASS | RT. `PasswordResetController` | `AuthTest::test_forgot_password_does_not_reveal_unknown_emails`, `test_password_can_be_reset_with_valid_token` | — | — | — |
| Change password revokes other tokens, throttled | PASS | RT. `MeController::updatePassword`, `throttle:password` | `ChangePasswordTest` (3) | — | — | — |
| Expired / malformed tokens → JSON 401 | PASS | RT | `AuditRegressionTest::test_expired_and_invalid_tokens_are_rejected_with_json_401` | — | — | — |
| Tokens of deleted users stop working | PASS | RT | `AuditRegressionTest::test_tokens_of_deleted_users_stop_working` | — | — | — |
| Unauthenticated requests rejected on protected routes | PASS | RT | `AdminAuthorizationTest::test_guests_get_401_everywhere`, `AuthTest::test_me_requires_authentication_and_returns_json_401` | — | — | — |
| Request fields cannot escalate privileges (register, profile) | PASS | RT. Roles not fillable; `UpdateProfileRequest` allowlist | `AuthTest::test_registration_cannot_assign_roles`, `test_profile_update_only_changes_allowed_fields` | — | — | — |
| Per-section admin permission gates (7 roles × 13 sections, read + write) | PASS | RT. `routes/api.php` `can:` middleware, `AppServiceProvider` gates | `AdminAuthorizationTest` (data-provider) | — | — | — |
| Role management escalation guards | PASS | RT. `Admin\UserController::updateRoles` | `RoleManagementTest` (8) | — | — | — |
| Auth endpoint rate limiting | PASS | RT. `throttle:auth` (10/min/IP, 5/min/email) | `ChangePasswordTest::test_guests_cannot_change_passwords_and_attempts_are_throttled` | — | — | — |
| Login does not reveal account existence via timing | PARTIAL | ST. `AuthController::login` skips `Hash::check` when the email is unknown | — | Timing side channel for enumeration (mitigated by rate limit) | P3 | Hash-check against a dummy hash when the user is missing |
| Client token storage | PARTIAL | ST. `resources/js/api/client.js` stores the bearer token in `localStorage` | — | Any XSS can steal a 30-day token; no CSP | P2 | Move to Sanctum SPA cookie auth or add a strict CSP (Phase 12) |
| Email verification flow | MISSING | ST. `email_verified_at` exists; no verify endpoints | — | — | P3 | Add before community features |
| Business owners manage only their businesses | MISSING | ST. `BusinessPolicy::update` has the owner path, but there are no owner endpoints | `CoreEntitiesTest::test_policies_enforce_public_visibility_and_permissions` (policy only) | — | P2 | Phase 4 owner API |

## D. Homepage, navigation and responsive UI

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Homepage sections from live API with empty states | PASS | RT. `/api/v1/home` returns happening, popular, new_in_doon, eat, places, stories, collections, areas, explore_categories, map_preview; browser render | `DiscoveryApiTest::test_home_returns_all_sections_and_empty_arrays_without_data` | — | — | — |
| Desktop and mobile navigation | PASS | RT. Browser at 375 px: bottom nav Home/Explore/Search/Events/Saved, no horizontal scroll | Browser check | — | — | — |
| Home "Doon Map" preview | PARTIAL | ST. Static marker scatter, not an interactive map | — | — | P3 | Phase 7 |
| Demo content flagged | PASS | RT. "Demo data" badge, `is_demo` in API, noindex | `DiscoveryApiTest::test_demo_seeder_content_is_flagged_and_visible`, `SpaRoutingTest::test_demo_records_private_pages_and_admin_are_not_indexed` | — | — | — |
| Cookie consent gating GA4/GTM/Clarity/Meta Pixel | PASS | RT. `lib/consent.js`; trackers excluded from `/admin` | `SitePagesTest::test_shell_carries_consent_config_and_footer_pages` | — | — | — |
| Legal pages (privacy, terms, cookies, …) | PARTIAL | RT. Seeded and rendered; operator/grievance details show "(to be published)" | `SitePagesTest` (5) | Legal details unset; not lawyer-reviewed | P2 (launch blocker) | Fill Admin → Legal details; legal review |

## E. Business directory, details and claims

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Search + filters + sort + pagination combined | PASS | RT. `DiscoveryQuery::businesses`, allowlisted sort, `per_page` ≤ 100 | `DiscoveryApiTest::test_filters_by_category_including_children_area_price_and_rating`, `test_pagination_is_capped_and_sort_is_allowlisted` | — | — | — |
| "Open now" in local time incl. overnight hours | PASS | RT. `OpeningHours` | `DiscoveryApiTest::test_open_now_uses_local_time_and_overnight_hours` | — | — | — |
| Business detail with related entities and sub-resources | PASS | RT | `DiscoveryApiTest::test_business_subresources`; browser render | — | — | — |
| Unpublished and suspended listings hidden (404) | PASS | RT. `BusinessPolicy::view`, `Controller::ensureVisible` | `DiscoveryApiTest::test_business_detail_hides_unpublished_records_with_404`, `AuditRegressionTest::test_closed_businesses_stay_visible_and_labelled_while_suspended_ones_are_hidden` | — | — | — |
| Closed listings visible and labelled | PASS | RT (API) + ST (UI "Permanently closed" badge, `BusinessDetail.jsx:119`) | `AuditRegressionTest::test_closed_businesses_stay_visible_and_labelled_while_suspended_ones_are_hidden` | — | — | — |
| Call / Directions / Website / Email actions | PASS | RT. `lib/format.js` hrefs exercised with Node; tel strips formatting, directions use coordinates or "name, Dehradun" | Node check of `telHref`/`directionsHref` | — | — | — |
| WhatsApp action | PASS (fixed) | RT. `whatsappHref` now prefixes `91` for 10-digit / `0`-prefixed Indian numbers | Node check: `9876543210`, `09876543210`, `+91 …`, `+1 …` | **Fixed:** `wa.me/9876543210` (no country code) was an invalid link for numbers accepted by validation | P3 | — |
| Verification lifecycle (UNVERIFIED → … → VERIFIED/CLAIMED/SUSPENDED/CLOSED) | PASS | RT. `StatusTransitionService::transitionBusiness`; CLAIMED requires owner | `CoreEntitiesTest::test_business_status_transitions_are_enforced_and_audited`, `BusinessAdminTest::test_verification_goes_through_the_status_service` | — | — | — |
| Business claims workflow | MISSING | ST. `business_claims` table + `BusinessClaim` model only; no endpoints/UI ("being built" page) | Browser `/business-portal` | — | P2 | Phase 4 |
| Duplicate business detection / prevention | MISSING | ST. Only slug uniqueness (`-2` suffix); no name/phone/address/coordinate matching | — | Same business can be created twice | P2 | Add a duplicate check on create (normalized name + phone/geo radius) and a merge tool |
| Save / Review / Report incorrect info actions | MISSING | ST | — | — | P2 | Phase 5 |

## F. Places, attractions and geographic data

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Place listing, category/area/free filters | PASS | RT. `DiscoveryQuery::places` | `DiscoveryApiTest::test_places_stories_and_collections_respect_publication` | — | — | — |
| Place detail, photos, facilities, related | PASS | RT | `EditorialAdminTest::test_place_create_and_publish`, discovery tests | — | — | — |
| Coordinate validation (Uttarakhand bounding box, lat/lng as a pair) | PASS | RT. `AdminWriteRequest::coordinateRules` | `BusinessAdminTest::test_validation_rejects_bad_input` | — | — | — |
| Map and `/nearby` endpoints | MISSING | ST | — | — | P3 | Phase 7 |

## G. Events, dates, venues and tickets

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Upcoming listing in event's own time zone | PASS | RT. `EventResource` returns local ISO-8601; browser shows "Times in IST" | `DiscoveryApiTest::test_events_list_upcoming_public_events_in_local_time`, `EventAdminTest::test_local_times_are_read_in_the_event_time_zone_and_stored_in_utc` | — | — | — |
| Past events not shown as upcoming | PASS | RT | `AuditRegressionTest::test_past_events_are_not_listed_as_upcoming`, `CoreEntitiesTest::test_event_phase_is_derived_from_time` | — | — | — |
| All-day events | PASS (fixed) | RT. `Event::phase()` / `scopeUpcomingOrLive()` now use a 24 h window for all-day events without an end; UI omits the time | `AuditRegressionTest::test_all_day_events_without_an_end_last_the_whole_local_day` | **Fixed:** all-day events showed COMPLETED and disappeared from listings/sitemap at 06:00 on the day; UI showed "12:00 am" | P2 | — |
| Date-window filters (today, tomorrow, weekend, week, month, from/to) | PASS (fixed) | RT. `DiscoveryQuery::events` now uses `upcomingOrLive($from)` | `AuditRegressionTest::test_date_window_filters_keep_events_that_are_live_now`, `DiscoveryApiTest::test_event_date_window_filters` | **Fixed:** "today"/"week" dropped events in progress without an end time while the default list showed them as LIVE | P2 | — |
| Cancelled events labelled with reason | PASS | RT | `EventAdminTest::test_publish_cancel_with_reason_and_archive`, `AuditRegressionTest::test_cancelled_events_are_labelled_and_missing_venue_or_tickets_do_not_break_the_page` | — | — | — |
| Rescheduling keeps the original start | PASS | RT. `StatusTransitionService::rescheduleEvent`; direct date edits blocked on announced events | `EventAdminTest::test_rescheduling_a_published_event_keeps_the_original_start` (+2) | — | — | — |
| Invalid / implausible dates rejected (end < start, > 548 days ahead, bad TZ) | PASS | RT | `EventAdminTest::test_publishing_rejects_implausible_dates`, `test_event_validation` | — | — | — |
| Missing venue / ticket / organizer does not crash | PASS | RT. API returns nulls; browser render of demo event | `AuditRegressionTest::test_cancelled_events_are_labelled_and_missing_venue_or_tickets_do_not_break_the_page` | — | — | — |
| Public event submissions | MISSING | ST. Policy allows submitter edits; no endpoint | — | — | P3 | Phase 5 |

## H. Areas and neighbourhoods

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Area list and pages with businesses, places, events, stories | PASS | RT. `AreaController`; 13 seeded areas | `DiscoveryApiTest::test_areas_and_categories` | — | — | — |
| Area CRUD with audit | PASS | RT | `EditorialAdminTest::test_area_crud_is_audited` | — | — | — |

## I. Stories, guides, collections and heritage

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Stories/guides list and detail respecting publication | PASS | RT | `DiscoveryApiTest::test_places_stories_and_collections_respect_publication`, `EditorialAdminTest::test_story_publication_workflow` | — | — | — |
| Story/page HTML sanitized server-side | PASS | RT. `HtmlSanitizer` (symfony/html-sanitizer) in `StoryRequest`/`PageRequest` | `HtmlSanitizerTest` (12), `EditorialAdminTest::test_story_body_is_sanitized_server_side` | — | — | — |
| Collections of real entities, ordered items | PASS | RT. Publish requires ≥ 1 item | `EditorialAdminTest::test_collection_items_and_publication` | — | — | — |
| Linked entities on stories | PASS | RT | `EditorialAdminTest` | — | — | — |
| New in Doon / Best of Doon | PARTIAL | RT (filter `new` and collections work); no dedicated editorial workflow | Discovery tests | — | P3 | Phase 6 |
| Rich-text editor for stories | MISSING | ST. Raw HTML textarea | — | — | P3 | Phase 6 |

## J. Search, filters, sorting and recommendations

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Cross-entity search grouped by type | PASS | RT. `DatabaseSearchService` | `DiscoveryApiTest::test_search_groups_results_by_type` | — | — | — |
| LIKE wildcard escaping / injection-shaped input | PASS | RT. `DiscoveryQuery::applyText` escapes `%`, `_`, `!` with bound parameters | `AuditRegressionTest::test_injection_shaped_search_input_is_treated_as_text` | — | — | — |
| Filtered/search URLs not indexable | PASS | RT/ST. `SeoResolver::listPage` sets `noindex,follow` when filters present; `/search` noindex | `SpaRoutingTest` | — | — | — |
| Ranking service and recommendations | MISSING | ST | — | — | P3 | Phase 10 |
| Full-text search | MISSING | ST. `LOWER(col) LIKE '%…%'` scans | — | Will not scale past a few thousand rows | P3 | Phase 10 (FTS/Meilisearch) |

## K. Admin dashboard, CMS and moderation

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| CRUD for businesses, places, events, venues, organizers, stories, collections, areas, categories | PASS | RT | `BusinessAdminTest`, `EventAdminTest`, `EditorialAdminTest` | — | — | — |
| Every admin change audited (changed fields only) | PASS | RT. `AdminController::saveAudited`, `AuditLogger` | `BusinessAdminTest::test_update_audits_only_changed_fields_and_noop_is_not_logged` | — | — | — |
| Soft delete / restore | PASS | RT | `BusinessAdminTest::test_delete_and_restore_are_soft_and_audited` | — | — | — |
| Audit-log listing and dashboard | PASS | RT | `MediaAuditDashboardTest` | — | — | — |
| Media upload validation (sniffed MIME, raster only, ≤ 5 MB, ≤ 8000 px, server file names) | PASS | RT | `MediaAuditDashboardTest::test_dangerous_or_oversized_uploads_are_rejected`, `test_image_upload_is_stored_with_a_server_chosen_name_and_audited` | — | — | — |
| Site pages, SEO, settings, tracking admin | PASS | RT | `MarketingAdminTest`, `SitePagesTest` | — | — | — |
| Moderation queues (reviews, submissions, reports, claims) | MISSING | ST. Dashboard shows counts only | — | — | P2 | Phases 4–5 |
| Bulk operations | MISSING | ST | — | — | P3 | Add with moderation screens |
| Relation pickers beyond 100 options | PARTIAL | ST. First 100 options loaded (UI says when truncated) | — | — | P3 | Searchable picker |

## L. User accounts, favourites, reviews and submissions

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Profile view/update (allowlisted fields) | PASS | RT | `AuthTest::test_profile_update_only_changes_allowed_fields` | — | — | — |
| Avatar upload (`/me/avatar`) | MISSING | ST | — | — | P3 | Phase 5 |
| Favourites | MISSING | ST. Table + model; `/saved` is a sign-in placeholder | Browser `/saved` | — | P2 | Phase 5 |
| Reviews (create, edit own only, moderation) | MISSING | ST. `ReviewPolicy` restricts updates to the author; no endpoints | — | — | P2 | Phase 5; reuse `ReviewPolicy` |
| Submissions, corrections and reports | MISSING | ST. Tables + enums only | — | — | P2 | Phase 5 |

## M. Business-owner portal and lead analytics

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Owner portal (`/me/businesses/*`) | MISSING | ST. `/business-portal` says "being built" | Browser | — | P2 | Phase 4 |
| Owner lead analytics | MISSING | ST | — | — | P3 | Phase 4/9 |
| First-party analytics ingestion (allowlisted names, rate-limited, no raw IP) | PASS (fixed) | RT. `AnalyticsController` now accepts only public entities | `DiscoveryApiTest::test_analytics_accepts_allowlisted_events_only`, `AuditRegressionTest::test_analytics_does_not_reveal_whether_hidden_records_exist` | **Fixed:** endpoint answered 202 vs 422 by existence, revealing hidden/unpublished record IDs and accepting events for them | P3 | — |
| Admin analytics report | PASS | RT | `MarketingAdminTest::test_analytics_report_and_page_view_tracking` | — | — | — |

## N–P. AI Data Engine

See [AI_DATA_ENGINE_AUDIT.md](AI_DATA_ENGINE_AUDIT.md) for detail.

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Provider abstraction (`AIProvider`, `AIResponse`) | PASS | RT | `GroqProviderTest::test_container_resolves_configured_provider` | — | — | — |
| Groq provider: JSON mode, timeout, errors without key leakage | PASS | RT (HTTP fakes; no live calls) | `GroqProviderTest` (5) | — | — | — |
| Provider retry policy | PARTIAL | ST. `retry(2, 500, throw: false)` retries every failed response incl. 400/401/422 | — | Wasted calls/tokens on non-retryable errors | P3 | Retry only connection errors, 429 and 5xx |
| AI token budgets enforced | MISSING | ST. `config('ai.budget')` is never read | — | Budgets are configuration only | P2 (blocker for Phase 14) | Usage ledger + pre-call budget check |
| Source registry, domain allowlist, fetch-method controls | MISSING | ST | — | — | P2 | Phase 14 |
| Scheduler discovery and dispatch | MISSING | ST | — | — | P2 | Phase 14 |
| Extraction schema validation | MISSING | ST | — | — | P2 | Phase 14 |
| Field validation (phone, URL, date, coordinates) for AI candidates | MISSING | ST. Rules exist for admin input only (`AdminWriteRequest`) | — | — | P2 | Reuse admin rules in a `ContentValidator` |
| Deduplication / entity matching | MISSING | ST | — | — | P2 | Phase 14 |
| Confidence scoring (source reliability, validation, corroboration) | MISSING | ST | — | — | P2 | Phase 14 |
| Review queue, publication, revert, change history | MISSING | ST | — | — | P2 | Phase 14 |
| Prompt-injection isolation | MISSING | ST | — | — | P2 | Phase 14 |
| Idempotent jobs / safe retries | MISSING | ST | — | — | P2 | Phase 14 |
| Daily processing report | MISSING | ST | — | — | P3 | Phase 14 |
| Provenance on public records (source name/URL, last verified) | PARTIAL | RT. Manual fields stored and shown ("Provenance") | Discovery tests | No per-field evidence/history | P3 | `ai_content_changes` in Phase 14 |
| Unsafe AI publication path | NOT_APPLICABLE | ST. No code path lets AI output reach public tables; nothing calls `AIProvider` outside tests | grep of `app/` | — | — | Keep it that way: route through `StatusTransitionService` |

## Q. SEO, metadata, sitemaps and structured data

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Server-rendered title/description/canonical/OG/Twitter | PASS | RT | `SpaRoutingTest::test_frontend_paths_serve_the_spa_shell_with_server_rendered_seo` | — | — | — |
| JSON-LD only from real fields, script-safe encoding | PASS | RT/ST. `SeoPage::jsonLdScript` uses `JSON_HEX_TAG` | `SpaRoutingTest` | — | — | — |
| Canonical 301s (lowercase, no trailing slash) | PASS | RT. Browser `/Businesses/` → 301 | `SpaRoutingTest::test_canonical_redirects` | — | — | — |
| Real 404 + noindex for unknown/hidden records | PASS | RT | `SpaRoutingTest::test_unknown_pages_and_hidden_records_return_404_with_noindex` | — | — | — |
| Sitemap excludes demo, noindex, hidden and past events | PASS | RT | `SpaRoutingTest::test_robots_and_sitemap` | — | — | — |
| Sitemap freshness | PARTIAL | ST. Cached 1 h with no invalidation on publish/unpublish | — | Unpublished URLs may stay listed ≤ 1 h | P3 | `Cache::forget` on status changes |
| robots.txt honours "allow indexing" | PASS | RT | `SpaRoutingTest::test_robots_and_sitemap` | — | — | — |
| SEO overrides admin | PASS | RT | `MarketingAdminTest::test_seo_overrides_for_pages_and_records` | — | — | — |
| Body content prerendering | PARTIAL | ST. Metadata server-side, body client-rendered | — | Crawlers that do not run JS see no body | P3 | Phase 9 prerender/SSR |

## R. Monetization

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Plans CRUD | PASS | RT | `MarketingAdminTest::test_plans_subscriptions_and_revenue_from_recorded_payments` | — | — | — |
| Manually recorded subscriptions and revenue report | PASS | RT | same | — | — | — |
| Entitlements / feature gating | MISSING | ST | — | — | P3 | Phase 8 |
| Payment gateway, webhooks, invoicing/GST | NOT_APPLICABLE | Blueprint: "no real collection until legal/security complete" | — | — | — | — |
| Advertisements / sponsored placement | MISSING | ST | — | — | P3 | Phase 8 |

## S. Notifications, PWA and offline

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| In-app/email notifications (beyond password reset) | MISSING | ST | — | — | P3 | Phase 11 |
| PWA manifest, service worker, offline | MISSING | ST. No manifest or SW in `public/` or `resources/js` | — | — | P3 | Phase 11 |

## T. Security, performance, monitoring, backups and deployment

See [SECURITY_FINDINGS.md](SECURITY_FINDINGS.md).

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| SQL injection defences | PASS | RT/ST. Eloquent bindings; raw SQL only with bound params; allowlisted sorts | `AuditRegressionTest::test_injection_shaped_search_input_is_treated_as_text`, `DiscoveryApiTest::test_pagination_is_capped_and_sort_is_allowlisted` | — | — | — |
| Stored XSS defences (sanitize on write, escape in Blade/JSON) | PASS | RT | `HtmlSanitizerTest`, `SitePagesTest::test_pages_fill_legal_details_escaped_and_never_invent_missing_ones` | — | — | — |
| Defence in depth for `dangerouslySetInnerHTML` | PARTIAL | ST. `StoryDetail.jsx`, `SitePage.jsx`, admin preview render stored HTML without client-side sanitizing | — | Any future write path that skips `HtmlSanitizer` (e.g. AI drafts, seeders) becomes XSS | P3 | Sanitize in the model mutator, not only in Form Requests |
| CSRF | PASS | ST. Bearer-token API (no cookie auth); web routes are GET only | — | — | — | Revisit if moving to cookie auth |
| CORS | PARTIAL | ST. No `config/cors.php`, so framework default (`*` on `api/*`) | — | Any origin can call the API (no cookies, so low risk) | P3 | Restrict to the site origin (runbook item) |
| Security headers / CSP / HSTS | MISSING | ST. None set in app or `.htaccess` | — | — | P2 | Add middleware with CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`, HSTS |
| Rate limits (api 120/min, auth, password, analytics, uploads) | PASS | RT/ST | `ChangePasswordTest` throttle test | — | — | — |
| Secrets and personal data not exposed | PASS | RT. `UserResource` self-only; admin user listing hides secrets; Groq errors omit key | `RoleManagementTest::test_user_listing_filters_by_role_and_never_exposes_secrets`, `GroqProviderTest::test_http_errors_do_not_leak_the_key` | — | — | — |
| Production error responses | PASS | RT. `APP_DEBUG=false` → `{"message":"Server Error"}` | `AuditRegressionTest::test_server_errors_do_not_expose_stack_traces_when_debug_is_off` | — | — | — |
| Uploaded image re-encoding / EXIF stripping | MISSING | ST. Stored as-is | — | Photo GPS metadata published | P3 | Re-encode with GD/Imagick |
| N+1 protection | PASS | RT. `Model::preventLazyLoading()` in non-production; whole suite runs with it | Whole suite | — | — | — |
| Caching respects invalidation | PASS | ST. Settings cache forgotten on update; sitemap see Q | — | — | — | — |
| JS dependency vulnerabilities | PASS | RT. `npm audit`: 0 vulnerabilities | — | — | — | — |
| PHP dependency vulnerabilities | BLOCKED | `composer audit` failed: TLS error 60 (local TLS-scanning CA) | — | — | P3 | Run in CI or with `COMPOSER_CAFILE` |
| Backups and restore drill | MISSING | ST. No production environment; runbook lists as todo | — | — | P2 (launch blocker) | Automated backups + restore drill on staging |
| Staging environment | MISSING | ST. Runbook: "No staging or production environment exists yet" | — | — | P2 (launch blocker) | Provision staging |

## U. End-to-end testing and launch readiness

| Feature | Status | Evidence | Test executed | Defect | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Backend suite (SQLite) | PASS | RT. 133 tests, 1141 assertions | `php vendor/bin/phpunit` | — | — | — |
| Backend suite (MariaDB 10.4 parity) | PASS | RT. 133 tests, 1141 assertions | `DB_CONNECTION=mysql DB_DATABASE=doonportal_test php vendor/bin/phpunit` | — | — | — |
| Frontend unit/component tests | MISSING | ST. No Vitest/Jest config | — | — | P3 | Add Vitest for `lib/format.js`, consent, filters |
| Automated end-to-end tests | MISSING | ST. Browser checks are manual | — | — | P2 | Playwright for home → search → detail → admin edit |
