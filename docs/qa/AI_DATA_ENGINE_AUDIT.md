# AI Data Engine Audit

_Audit date: 2026-10-20 · Reference: [../ai-data-engine.md](../ai-data-engine.md), blueprint §15 (Phase 14)._

## Verdict

**The AI Data Engine is not implemented.** Only the provider layer from Phase 0 exists. There are no `ai_*` tables, no sources, jobs, scheduler entries, validators, matchers, scorers, review queue or reports. This matches the project's own status ("NOT_STARTED, provider scaffold done").

**Safety consequence:** no code path can currently publish AI output. Nothing in `app/` calls `AIProvider` outside the container binding and its tests, so the "AI never writes to production tables" principle holds trivially. It holds by absence, not because the controls exist.

## What exists

| Component | File | Status | Evidence |
|---|---|---|---|
| Provider interface | `app/AI/AIProvider.php` | PASS | `chatJson()` returns `AIResponse` (decoded JSON, provider, model, token usage) |
| Groq provider | `app/AI/Providers/GroqProvider.php` | PASS | JSON mode, configurable timeout, fails fast without a key, rejects non-JSON content, errors omit the key. `GroqProviderTest` (5) uses HTTP fakes; no live calls were made. |
| Fake provider | `app/AI/Providers/FakeProvider.php` | PASS | Used by tests |
| Config | `config/ai.php` | PARTIAL | Provider, model, timeout, daily and monthly token budgets |
| Budget enforcement | — | MISSING | `config('ai.budget.*')` is never read. No usage ledger. |
| Retry policy | `GroqProvider` | PARTIAL (P3) | `retry(2, 500, throw: false)` also retries non-retryable 4xx |

## Required scenarios

| Scenario | Status | Notes |
|---|---|---|
| Scheduler discovers and dispatches configured sources | MISSING | No `ai_sources`, no jobs, no `Schedule` entries |
| Disallowed domains and prohibited fetch methods rejected | MISSING | No fetcher or allowlist |
| Source failures isolated from unrelated jobs | MISSING | No jobs |
| Extracted JSON must pass schema validation | MISSING | `AIResponse` holds untrusted data; no validator consumes it |
| Invalid phones, URLs, dates and coordinates rejected or held | MISSING (reusable rules exist) | `AdminWriteRequest` has phone regex, `url:http,https`, Uttarakhand bounding box and pincode rules; `StatusTransitionService` has the implausible-date and time-zone guards. These should back a `ContentValidator`. |
| Duplicate candidates do not create duplicate entities | MISSING | No duplicate detection even for manual entry (see matrix E) |
| Confidence uses source reliability, validation and corroboration | MISSING | — |
| AI-provided confidence alone cannot authorize publication | MISSING (not exploitable today) | — |
| Low-confidence records require review | MISSING | — |
| High-risk field changes need stronger evidence | MISSING | — |
| Repeated jobs are idempotent | MISSING | — |
| Failed jobs retry without duplicate publication | MISSING | — |
| Provider outages fail safely | PARTIAL | Provider throws `AIProviderException` on timeout, HTTP error or bad JSON. No caller or circuit breaker exists yet. The public site has no AI dependency. |
| External content cannot override instructions | MISSING | No prompts exist yet |
| Published records keep provenance and audit history | PARTIAL | Records carry `source_name`, `source_url` and `last_verified_at`; admin edits are fully audited in `audit_logs`. No per-field evidence. |
| Proposed changes can be reviewed and reverted | MISSING | `audit_logs` stores old and new values but there is no revert action |
| Daily reports match processing records | MISSING | — |
| AI usage and budget limits enforced | MISSING | See above |

## Foundations already in place for Phase 14

- `StatusTransitionService`: the single, transactional, audited path for status changes, including the guard that a business is never VERIFIED or CLAIMED without explicit action. AI publication must go through it.
- `AuditLogger` with actor, before/after values and `EntityType` morph allowlist, reusable for `ai_content_changes`.
- `EntityType::morphMap()` for polymorphic AI targets.
- Validation rules in `AdminWriteRequest` and its subclasses, to extract into a shared validator.
- `HtmlSanitizer` for any AI-drafted editorial HTML. Sanitize at the model layer first (SEC-06).

## Prerequisites before any AI ingestion is enabled

1. Budget ledger and pre-call enforcement (daily and monthly).
2. Source registry with domain allowlist, robots/terms notes and a per-source rate limit.
3. Schema-validated extraction and deterministic field validation.
4. Duplicate matcher, which manual entry also needs.
5. Review queue. Auto-publish stays off in production until rollback and monitoring are tested, as the blueprint requires.
