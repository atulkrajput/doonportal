# Security Findings

_Audit date: 2026-10-20 · Scope: `claude/phase3-admin-cms` @ `c79c59f` plus audit fixes. No secrets, tokens or personal data are reproduced here._

**Summary:** no P0 or P1 security findings. The authorization model (permission gates on every admin route, policy-based 404s for hidden records, non-fillable privileged columns, role-escalation guards) held up under both the existing tests and the new runtime probes. The open issues are hardening items the roadmap already places in Phase 12, plus the deployment controls needed before launch.

## Open findings

| ID | Severity | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| SEC-01 | P2 | No security headers: no CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` or `frame-ancestors`. | ST: nothing in `bootstrap/app.php`, middleware or `public/.htaccess` | Add a response-header middleware. Start the CSP in report-only mode, since GA4/GTM/Clarity/Pixel load after consent. |
| SEC-02 | P2 | Bearer token (30-day expiry) is stored in `localStorage`. Combined with SEC-01, any XSS gives full account takeover. | ST: `resources/js/api/client.js:21-32`, `AuthController::tokenResponse` | Move to Sanctum SPA cookie auth (httpOnly, SameSite) or shorten token lifetime and add a CSP. |
| SEC-03 | P2 | No backups, restore drill, monitoring or staging environment. | ST: `docs/deployment-runbook.md` ("No staging or production environment exists yet") | Required before launch; see the remediation plan. |
| SEC-04 | P3 | Login timing side channel: `Hash::check` is skipped when the email is unknown. | ST: `AuthController::login` | Check against a fixed dummy hash when the user is not found. Throttling already limits exploitation. |
| SEC-05 | P3 | CORS falls back to the framework default (`*` for `api/*`). | ST: no `config/cors.php` | Publish `config/cors.php` and restrict `allowed_origins` to `APP_URL`. |
| SEC-06 | P3 | Stored HTML is rendered with `dangerouslySetInnerHTML` and sanitized only in Form Requests (`StoryRequest`, `PageRequest`) and `SitePagesSeeder`. A future write path that skips them (AI drafts, imports, tinker) would be stored XSS. | ST: `StoryDetail.jsx:40`, `SitePage.jsx:39`, `admin/pages/ResourceEdit.jsx:383` | Sanitize in a model mutator or cast on `Story::body` and `Page::body`. |
| SEC-07 | P3 | Uploaded images are stored without re-encoding, so EXIF data (including GPS) is published. | ST: `MediaService::store` | Re-encode with GD or Imagick and strip metadata. |
| SEC-08 | P3 | `.env.example` ships `APP_DEBUG=true` and `LOG_LEVEL=debug`. | ST | Acceptable for local use; the production checklist must enforce `APP_DEBUG=false` (verified safe in a test, see below). |
| SEC-09 | P3 | Groq client retries non-retryable 4xx responses, including 401. | ST: `GroqProvider` `retry(2, 500, throw: false)` | Retry only on connection errors, 429 and 5xx. |
| SEC-10 | P3 | PHP dependency audit could not run. | `composer audit` → curl error 60 | Run `composer audit` in CI. |

## Fixed during the audit

| ID | Severity | Finding | Fix | Regression test |
|---|---|---|---|---|
| SEC-F1 | P3 | `POST /api/v1/analytics/events` answered 202 for any existing record and 422 otherwise. This revealed whether unpublished or suspended IDs exist and let analytics be recorded against hidden records. | `AnalyticsController::store` accepts only records where `isPublic()` is true | `AuditRegressionTest::test_analytics_does_not_reveal_whether_hidden_records_exist` |

## Verified controls (runtime evidence)

| Requirement | Result | Test |
|---|---|---|
| Unauthenticated requests rejected | JSON 401 on all admin and `me` routes | `AdminAuthorizationTest::test_guests_get_401_everywhere` |
| Invalid, expired and deleted-user tokens | JSON 401 | `AuditRegressionTest::test_expired_and_invalid_tokens_are_rejected_with_json_401`, `test_tokens_of_deleted_users_stop_working` |
| Admin-only operations reject other roles | 403 per permission, 7 roles × 13 sections | `AdminAuthorizationTest` |
| Business owner cannot use admin endpoints for their own listing | 403 | `AdminAuthorizationTest::test_business_owner_cannot_use_admin_endpoints_for_their_own_listing` |
| No privilege escalation through request fields | Roles, status, owner and ratings ignored | `AuthTest::test_registration_cannot_assign_roles`, `BusinessAdminTest::test_protected_fields_cannot_be_set_through_create_or_update` |
| Role escalation (ADMIN → SUPER_ADMIN, self-edit) | Blocked | `RoleManagementTest` |
| SQL injection and LIKE wildcards | Treated as literal text | `AuditRegressionTest::test_injection_shaped_search_input_is_treated_as_text` |
| Stored XSS in stories and pages | Scripts, handlers, `javascript:` and iframes stripped | `HtmlSanitizerTest` (12) |
| XSS through settings and tracking | IDs only, strict regex, fixed templates | `MarketingAdminTest::test_tracking_settings_accept_ids_only_and_are_audited` |
| JSON-LD and site-config injection | `JSON_HEX_TAG` encoding | `SpaRoutingTest` |
| Upload validation (MIME sniffing, SVG rejected, size and dimensions) | Enforced | `MediaAuditDashboardTest::test_dangerous_or_oversized_uploads_are_rejected` |
| Hidden records indistinguishable from missing | 404 | `DiscoveryApiTest::test_business_detail_hides_unpublished_records_with_404` |
| Production errors hide stack traces | `{"message":"Server Error"}` | `AuditRegressionTest::test_server_errors_do_not_expose_stack_traces_when_debug_is_off` |
| Secrets not exposed | Admin user listing hides secrets; Groq errors omit the key | `RoleManagementTest::test_user_listing_filters_by_role_and_never_exposes_secrets`, `GroqProviderTest::test_http_errors_do_not_leak_the_key` |
| Rate limits | Auth, password, analytics, uploads, api | Throttle test plus static review of `AppServiceProvider::configureRateLimiting` |
| Password reset does not enumerate accounts | Same response either way | `AuthTest::test_forgot_password_does_not_reveal_unknown_emails` |
| CSRF | Not applicable: bearer-token API; web routes are GET only | Static |

## Database transactions

Multi-step writes (status changes, admin saves with relation syncs, role changes, settings, media) run inside `DB::transaction` and write their audit row in the same transaction. Media upload deletes the stored file when the transaction fails.
