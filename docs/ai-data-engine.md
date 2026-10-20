# AI Data Engine

## Status

| Piece | State |
|---|---|
| Provider abstraction (`App\AI\AIProvider`) | Implemented and tested |
| Groq provider (`GroqProvider`, JSON mode, timeouts, retries, key never logged) | Implemented, tested with HTTP fakes |
| Fake provider for tests/local | Implemented |
| Config (`config/ai.php`: provider, model, timeout, daily/monthly token budgets) | Implemented |
| OpenAI provider; provider, model and keys editable in Admin > AI settings (keys encrypted, write-only) | Implemented and tested |
| Daily business discovery (`doon:discover`, 1 AM IST): OpenStreetMap + Tavily web search + AI extraction/description, dedupe, review queue (Admin > AI discoveries), runs log | Implemented and tested (first slice of the pipeline below) |
| Full pipeline for places/events, change detection on existing listings, auto-publish | Not started |

Environment:

```
AI_PROVIDER=groq            # or "fake"
GROQ_API_KEY=               # set in .env only; never commit
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
AI_TIMEOUT_SECONDS=30
AI_DAILY_TOKEN_BUDGET=500000
AI_MONTHLY_TOKEN_BUDGET=10000000
```

`AIProvider::chatJson()` returns an `AIResponse` with the decoded JSON object, provider, model and token usage. The data is **untrusted**: callers must validate it against a schema before use.

## Daily business discovery (built)

Every night at 01:00 IST (`routes/console.php`, needs the cron `* * * * * php artisan schedule:run`), when switched on in Admin > AI settings:

1. One OpenStreetMap (Overpass) query for all mapped business categories inside the Dehradun bounding box (`config/discovery.php`), with fallback mirrors when the public server is busy.
2. Per category, up to the configured number (default 5) of named places not already listed (same phone, or similar name within 250 m) and never queued before (unique `source + external_id`).
3. If that is short and web search is on: one Tavily search per category; the AI lists businesses the pages name; a name is kept only if the page text contains it, and a phone/website/address only if the page contains it. Directories and aggregators are excluded.
4. The AI writes a neutral description from the source facts only, with a confidence and flags (not a business, wrong category, may be closed, chain); healthcare finds are flagged for careful checks.
5. Everything waits in Admin > AI discoveries (`ai_discoveries`). Staff edit, approve (one or in bulk) or reject / mark duplicate. Approval creates a published **UNVERIFIED** listing through `BusinessWriter`, credited to the source (`source_name` "OpenStreetMap contributors" or the web domain, `source_url`), with hours parsed from OSM `opening_hours` when unambiguous. Runs are logged in `ai_runs` (Admin > Discovery runs); "Run now" queues a run that the scheduler starts within a minute.

AI calls stop for the day once `AI_DAILY_TOKEN_BUDGET` is used; OpenStreetMap discovery continues without AI. The footer credits © OpenStreetMap contributors (ODbL).

## Target pipeline (Phase 14)

```
DISCOVER → FETCH → EXTRACT → CLASSIFY → VALIDATE → MATCH → SCORE → REVIEW / AUTO-PUBLISH → AUDIT → REFRESH
```

Principles:

- AI never writes to production tables. It returns schema-constrained JSON to deterministic code; publication goes through the same domain services as humans (`StatusTransitionService`, future `PublishingService`).
- Every extraction stores provider, model, prompt version and schema version, plus field-level evidence and source references.
- Source content is untrusted input; embedded instructions are ignored. Domain allowlists, robots/terms compliance, rate limits, timeouts and budgets apply. No CAPTCHA/login/paywall bypassing.
- A high confidence score never overrides failed validation, missing evidence or an untrusted source. A newly discovered business is never auto-labelled VERIFIED.
- Stricter rules for closures, address/phone changes, event cancellations/dates/prices, healthcare and legal/safety claims.
- Jobs are queued, idempotent (content hashes, unique keys), overlap-protected, resumable, and isolated per source; AI outages never affect the public site.

## Planned schema

| Table | Key columns |
|---|---|
| `ai_sources` | name, url, type, permitted_domains (json), fetch_method, parser_config (json), reliability_score, is_active, crawl_frequency, rate_limit, compliance_notes, last_run_at, last_success_at, last_failure_at |
| `ai_source_runs` | source_id, started_at, finished_at, status, discovered/processed/failed counts, error_summary |
| `ai_discovered_items` | source_id, run_id, source_url, external_id, content_hash (unique per source), title, normalized_content_ref, candidate_entity_type, matched entity (morph), status, confidence, publication_state, error |
| `ai_extractions` | discovered_item_id, provider, model, prompt_version, schema_version, data (json), evidence (json), model_confidence, token usage |
| `ai_validation_results` | extraction_id, status, field_results (json), errors, warnings, validated_at |
| `ai_entity_matches` | discovered_item_id, entity morph, score, reasons (json), decision |
| `ai_confidence_scores` | discovered_item_id, overall, source_reliability, extraction_quality, validation_quality, match_quality, corroboration, risk_level, decision |
| `ai_ingestion_jobs` | discovered_item_id, job_type, status, attempts, scheduled_at, started_at, finished_at, error |
| `ai_content_changes` | entity morph, source_id, discovered_item_id, field, old_value, proposed_value, final_value (json), confidence, decision, reviewer_id, reviewed_at, reverted_at |

Entity morphs use the existing `EntityType` allowlist.

## Illustrative publication policy

| Score | Default action |
|---|---|
| 95–100 | Eligible for auto-publish if every safety gate passes (off in production until tested) |
| 85–94 | Auto-apply low-risk enrichment only; otherwise review |
| 70–84 | Human review |
| 50–69 | Hold for investigation |
| < 50 | Reject or keep as unverified |

## Planned modules

`app/AI/{EntityExtractor, EntityClassifier, DuplicateDetector, ConfidenceScorer, ContentValidator, ChangeDetector}`, jobs `DiscoverSourcesJob … GenerateEditorialDraftJob`, services `SourceDiscoveryService, EntityIngestionService, EntityMatchingService, PublishingService, EntityChangeService`, an AI/Data Operations admin section and a daily report — as specified in the product blueprint.
