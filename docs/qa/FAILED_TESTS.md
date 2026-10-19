# Failed Tests and Check Results

_Audit date: 2026-10-20 · Branch `claude/doonportal-feature-audit-05571e` (= `claude/phase3-admin-cms` @ `c79c59f` + audit fixes)._

## Current state

**No failing tests.** Every check below was executed during the audit and its output inspected.

| Check | Command | Result |
|---|---|---|
| Backend tests, SQLite in-memory (baseline, before audit changes) | `php vendor/bin/phpunit` | OK — 123 tests, 1093 assertions |
| Backend tests, SQLite in-memory (after fixes) | `php vendor/bin/phpunit` | OK — 133 tests, 1141 assertions |
| Backend tests, MariaDB 10.4.32 (after fixes) | `DB_CONNECTION=mysql DB_DATABASE=doonportal_test php vendor/bin/phpunit` | OK — 133 tests, 1141 assertions |
| PHP code style | `php vendor/bin/pint --test` | passed |
| JS lint | `npm run lint` (ESLint) | no problems |
| Production build | `npm run build` (Vite 7.3.7) | built; `main` 438 kB (141 kB gzip), `AdminApp` 105 kB |
| JS dependency audit | `npm audit` / `npm audit --omit=dev` | 0 vulnerabilities |
| PHP dependency audit | `composer audit` | **BLOCKED** — curl error 60 (local TLS-scanning certificate not trusted by XAMPP PHP) |
| CI on GitHub | `.github/workflows/tests.yml` | **BLOCKED** — not run in this audit (no push); never run per `docs/implementation-status.md` |
| Runtime smoke (browser, seeded demo SQLite DB, `php artisan serve`) | Home, business list/detail, event detail, `/saved`, `/business-portal`, 375 px mobile | Rendered; statuses as expected; only console error was the deliberate 404 probe |

## Tests that failed during the audit (now fixed)

The new suite `tests/Feature/Audit/AuditRegressionTest.php` was written first and run against the unmodified code. Three tests failed, confirming defects:

| Test | Failure before fix | Root cause | Fix | Result after fix |
|---|---|---|---|---|
| `test_all_day_events_without_an_end_last_the_whole_local_day` | `Failed asserting that two strings are identical. -'LIVE' +'COMPLETED'` | `Event::phase()` and `scopeUpcomingOrLive()` assumed a 6-hour duration for every event without `ends_at`, ignoring `is_all_day` | 24-hour window for all-day events (`Event::ALL_DAY_DURATION_HOURS`) | PASS |
| `test_date_window_filters_keep_events_that_are_live_now` | `Failed asserting that actual size 0 matches expected size 1.` (`?when=today`) | `DiscoveryQuery::events()` used a different overlap rule (`starts_at >= from`) for events without an end than the default listing | Window start now uses `upcomingOrLive($from)` | PASS |
| `test_analytics_does_not_reveal_whether_hidden_records_exist` | `Expected response status code [422] but received 202.` | `AnalyticsController::store` checked existence, not visibility | Only public records are accepted | PASS |

The other seven new tests passed on the unmodified code (expired and invalid tokens, deleted-user tokens, production error output, injection-shaped search input, closed and suspended visibility, cancelled events with missing venue and tickets, past events).

## Known gaps in test coverage (not failures)

- No frontend unit or component tests. The `whatsappHref` fix was checked with a one-off Node script, not a committed test.
- No automated end-to-end tests; browser checks are manual.
- Features marked MISSING in the matrix have no tests because they have no implementation.
