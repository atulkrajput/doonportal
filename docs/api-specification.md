# API Specification — `/api/v1`

JSON only. Single resources are wrapped in `data`; paginated lists return `{data, links, meta}` (Laravel paginator). Errors:

```json
{ "message": "The given data was invalid.", "errors": { "field": ["Validation message."] } }
```

Statuses used: 200, 201, 202, 204, 401, 403 (signed in but not permitted — admin routes), 404 (also for records the viewer may not see), 409 (invalid status transition), 422, 429.

Authentication: `Authorization: Bearer <token>` from register/login. Public endpoints accept a token optionally (editors can then see unpublished records).

Rate limits: `api` 120/min per user or IP; `auth` 10/min per IP and 5/min per email; `password` 5/min per user; `analytics` 60/min.

## Common list parameters

| Param | Rules |
|---|---|
| `page` | integer ≥ 1 |
| `per_page` | 1–100, default 20 |
| `sort` | endpoint allowlist only (first value is the default) |
| `q` | ≤ 100 chars, case-insensitive substring |

## Auth & account

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `name, email, password, password_confirmation, device_name?` → 201 `{token, user}`; role USER assigned server-side |
| POST | `/auth/login` | `email, password` → `{token, user}`; 422 on bad credentials |
| POST | `/auth/logout` | revokes current token → 204 |
| POST | `/auth/forgot-password` | always 200 with the same message (no account enumeration) |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation`; revokes all tokens |
| GET | `/auth/me`, `/me` | private profile incl. roles + permissions |
| PATCH | `/me` | `name?, phone?, bio?` (email/roles not changeable here) |
| PUT | `/me/password` | `current_password, password, password_confirmation` → 200 `{message}`. 422 if the current password is wrong, the new one is weak (≥ 8 chars) or unchanged. Revokes every **other** token (the one used stays valid); audited as `user.password_changed` (no password data logged); throttled 5/min per user. |

## Discovery

| Method | Path | Filters / notes |
|---|---|---|
| GET | `/home` | sections: `happening, popular, new_in_doon, eat, places, stories, collections, areas, explore_categories, map_preview` (cached 5 min) |
| GET | `/search?q=` | `q` 2–100 chars, `types=business,place,event,story`, `limit` 1–20 (default 5) → `{query, results: {type: [card]}, total}` |
| GET | `/businesses` | `category` (slug, includes children), `area`, `price` (`1,2` or `price[]=`), `min_rating`, `open_now`, `verified`, `new`, `q`; sort `popular·rating·newest·name` |
| GET | `/businesses/{slug}` | + hours, areas, social links |
| GET | `/businesses/{slug}/photos` | approved only, paginated |
| GET | `/businesses/{slug}/services` | |
| GET | `/businesses/{slug}/offers` | active and within dates |
| GET | `/businesses/{slug}/reviews` | published only; author name only |
| GET | `/businesses/{slug}/related` | shared category, same area first, max 6 |
| GET | `/places` | `category`, `area`, `free`, `q`; sort `popular·rating·newest·name` |
| GET | `/places/{slug}`, `/photos`, `/related` | |
| GET | `/events` | `when=today·tomorrow·weekend·week·month` or `from`/`to` (Y-m-d, IST), `category`, `area` (event or venue area), `free`, `include_past`, `q`; sort `soonest·newest`. Default: not yet ended. Cancelled events stay listed with `is_cancelled`. |
| GET | `/events/{slug}`, `/related` | times are ISO-8601 in the event's time zone; `phase` = UPCOMING/LIVE/COMPLETED |
| GET | `/areas` | with public counts |
| GET | `/areas/{slug}` and `/businesses·places·events·stories` | sub-lists accept the entity's filters |
| GET | `/categories?type=` | tree: top level + active children |
| GET | `/categories/{slug}` | with parent and children |
| GET | `/stories` | `type`, `category`, `q`; sort `newest·oldest`; body omitted in lists |
| GET | `/stories/{slug}` | body (sanitized HTML) + `linked_entities` (public only) |
| GET | `/collections`, `/collections/{slug}` | items as entity cards; non-public items skipped |

### Entity card (search, collections, story links)

```json
{ "type": "business", "id": "01J…", "slug": "…", "title": "…", "path": "/business/…",
  "summary": "…", "area": "Rajpur Road", "image": null, "is_demo": false,
  "is_verified": true, "rating": {"average": 4.5, "count": 12}, "location": {"lat": 30.3, "lng": 78.0} }
```

## Analytics

`POST /analytics/events` → 202

| Field | Rules |
|---|---|
| `name` | one of the allowlisted event names (see `App\Enums\AnalyticsEventName`) |
| `entity_type`, `entity_id` | together; type ∈ business, place, event, story, collection; must exist |
| `properties` | ≤ 10 flat scalar values, ≤ 200 chars each |

Stored with a daily-rotating HMAC session hash; raw IP and user agent are not stored.

## SEO, sitemap and robots

Every non-API path is served by `SpaController`, which renders the React shell **with server-side metadata** from `App\Services\Seo\SeoResolver`: `<title>`, description, canonical, robots, Open Graph/Twitter tags and JSON-LD (`WebSite`+`Organization` on `/`, `LocalBusiness`, `TouristAttraction`, `Event`, `Article`/`NewsArticle`, `CollectionPage`, `Place`, `BreadcrumbList`). Structured data uses only stored fields; demo records get none and are `noindex,nofollow`.

| Behaviour | Rule |
|---|---|
| Status | Unknown paths, unknown/hidden records and inactive categories return **404** (shell still renders, `noindex`). |
| Canonical URL | lowercase, no trailing slash; list pages keep only `?page=n` (n > 1). Uppercase or trailing-slash paths **301** to the canonical form; a guide under `/story/…` (or a story under `/guide/…`) 301s to its single URL. |
| Robots | `noindex` for `/login`, `/register`, password pages, `/saved`, `/search`, `/admin/*`, filtered list URLs (any query other than `page`), demo records, records/pages with a `noindex` override, and every page when *Allow indexing* is off. |
| Overrides | `seo_meta` per path (`/`, list/static pages, `/businesses/{category}`, `/places/{category}`) or per record; title template from SEO settings. |

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/seo?path=/business/x` | Same metadata as the server shell, for client-side navigation: `{status, title, description, canonical, robots, type, image, site_name, twitter_handle, json_ld}`. `path` must start with `/`. |
| GET | `/robots.txt` | Generated; disallows `/admin`, `/api/`, auth and search pages, lists the sitemap. With indexing off: `Disallow: /`. |
| GET | `/sitemap.xml` | Public, non-demo, non-`noindex` URLs with `lastmod`: home, static/list pages, businesses, places, upcoming events, stories/guides, collections, areas, active business/place categories. Cached 1 h (cleared when SEO overrides change). Empty when indexing is off. |

Analytics: `page_view` (properties `{path}`) is sent by the SPA on every public navigation.

## Site pages & cookie consent

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/pages` | Published pages: `slug, title, path, show_in_footer`. |
| GET | `/api/v1/pages/{slug}` | Published page with `body` rendered: `{{tokens}}` (`site_name`, `operator_name`, `contact_email`, `contact_phone`, `postal_address`, `grievance_officer_name`, `grievance_officer_email`, `jurisdiction_city`, `optional_tools`, `last_updated`) are filled from *Legal details* / tracking settings and HTML-escaped; an empty value renders as “(to be published)”. Drafts → 404. |

Pages are served at `/{slug}` (e.g. `/privacy`, `/terms`, `/cookies`, `/about`, `/contact`, `/disclaimer`, `/community-guidelines`) with server-side SEO (`WebPage`/`AboutPage`/`ContactPage` JSON-LD) and are listed in the sitemap.

**Cookie consent.** The shell's `#site-config` JSON carries `consent.tools` (configured tools grouped as `analytics` = GA4, Tag Manager, Clarity and `marketing` = Meta Pixel), a `consent.version` (changes when the tool set changes, so visitors are asked again) and the tracking IDs (empty on `/admin`). No third-party script is in the HTML: `resources/js/lib/consent.js` loads a tool only after its category is accepted; the choice is stored in `localStorage` for 12 months; withdrawing consent clears the tools' cookies and reloads. Search-engine verification meta tags stay server-side (no cookies).

## Admin & CMS — `/api/v1/admin`

All routes require `auth:sanctum` and the `admin.access` gate (the user holds at least one permission). Each group adds a permission gate (`can:<permission>`); SUPER_ADMIN passes every gate. Guests get 401; signed-in users without the permission get 403. Records are addressed by **id (ULID)**, not slug. Every write runs in a transaction and is written to `audit_logs` (actor, action, changed fields only as before/after, IP, user agent); no-op updates are not logged.

Responses: single records are `{data: {...}}` with every column plus loaded relations (and `type`, `is_demo`, `is_trashed`); lists are paginated `{data, links, meta}`.

### Common list parameters

| Param | Rules |
|---|---|
| `page`, `per_page` | per_page 1–100, default 25 |
| `q` | ≤ 100 chars; case-insensitive substring on name/title (+ a few text columns) |
| `sort` | `newest` (default) · `oldest` · `updated` · `name` · `starts_at` (events) |
| `status` | must be a valid status of that entity (422 otherwise) |
| `area_id`, `category_id` | ULIDs (businesses, places, events, venues) |
| `is_published` | `0`/`1` (businesses, areas; for categories: the active flag) |
| `type` | stories: story type; categories: category type |
| `trashed` | `with` · `only` (soft-deleted records) |

### Content resources

| Resource | Permission | Extra endpoints |
|---|---|---|
| `businesses` | `businesses.manage` | `POST /{id}/status` |
| `places` | `places.manage` | `POST /{id}/status` |
| `events` | `events.manage` | `POST /{id}/status`, `POST /{id}/reschedule` |
| `venues`, `organizers` | `events.manage` | — |
| `stories` | `stories.manage` | `POST /{id}/status` |
| `collections` | `collections.manage` | `POST /{id}/status`, `PUT /{id}/items` |
| `areas`, `categories` | `taxonomy.manage` | — |

Each resource has `GET /` (list), `POST /` (201), `GET /{id}` (also soft-deleted), `PATCH /{id}` (only sent fields are validated and changed), `DELETE /{id}` (soft delete, 204) and `POST /{id}/restore`.

Write rules (Form Requests in `app/Http/Requests/Admin`):

- Never writable here: `status`, `verified_at`, `owner_id`, rating aggregates, `metadata` (demo flags cannot be set or cleared), `published_at` of places/collections, `cancellation_reason`. Unknown keys are ignored.
- `slug`: optional, lowercase kebab-case, unique (including soft-deleted rows); blank = generate / keep.
- Coordinates: `latitude` and `longitude` together, inside the Uttarakhand bounding box (28.5–31.5 N, 77.5–81.1 E).
- URLs: `http`/`https` only. Phones: digits, spaces, dashes, optional leading `+`.
- `category_ids[]` must exist and match the entity's category type; `area_ids[]` must exist.
- **Businesses** also take `primary_category_id` (one of `category_ids`), `hours[]` (`day_of_week` 0–6, `opens_at`/`closes_at` as local `HH:MM`, `is_closed`; overnight slots allowed), `services[]` (`name`, `description`, `price_min_paise` ≤ `price_max_paise`), `social_links[]` (`platform` from an allowlist, `url`), `amenities[]`, `payment_methods[]`, `price_range` 1–4. A sent child array replaces all existing rows.
- **Places**: `facilities[]` (`name`, `notes`); entry fees in paise (min ≤ max).
- **Events**: `starts_at`/`ends_at` without an offset (e.g. `2026-11-01T18:00`) are read in the event's `timezone` (default Asia/Kolkata) and stored in UTC; `ends_at` ≥ `starts_at`; `timezone` must be an IANA name; `currency` is INR. Dates of PUBLISHED/CANCELLED events change only through `/reschedule` (422 otherwise). `submitted_by` is the creating user.
- **Stories**: `body` (≤ 200 000 chars) is sanitized server-side (allowlist: p, h2–h4, lists, links with forced `rel="noopener noreferrer nofollow"`, blockquote, code/pre, figure, tables, https/relative images; scripts, styles, event handlers, iframes, forms, SVG and `javascript:`/`data:` URLs are removed). `reading_minutes` is estimated when not sent; `published_at` (optional scheduling) is read as IST; `linked_entities[]` = `{type: business|place|event|area, id}`. `author_id` is the creating user.
- **Collections**: `curator_id` is the creating user. `PUT /{id}/items` with `items[]` = `{type: business|place|event|story, id, note?}` (≤ 100, no duplicates, must exist) replaces the ordered list; audited as `collection.items_updated`.
- **Categories**: `type` is required on create and cannot change; `parent_id` must be a top-level category of the same type; a category with children cannot be nested or deleted (422).

### Status changes

All go through `StatusTransitionService` and are audited as `<type>.status_changed`; an invalid transition returns 409.

| Endpoint | Body | Notes |
|---|---|---|
| `POST businesses/{id}/status` | `status` (BusinessStatus), `note?` | Transitions per `BusinessStatus`; VERIFIED sets `verified_at`; CLAIMED needs an approved owner. |
| `POST events/{id}/status` | `status` (EventStatus), `note` | `note` is **required** for CANCELLED and becomes `cancellation_reason`. Publishing checks start date, chronology, time zone and the ≤ 548-day plausibility window. |
| `POST events/{id}/reschedule` | `starts_at`, `ends_at?`, `reason?` | For PUBLISHED/CANCELLED events the first announced start is kept in `original_starts_at`; publish date checks apply (409); unchanged dates → 422. Audited as `event.rescheduled`. |
| `POST places/{id}/status`, `stories/{id}/status`, `collections/{id}/status` | `status` (DRAFT · REVIEW · PUBLISHED · ARCHIVED), `note?` | ARCHIVED can only go back to DRAFT or REVIEW. First publication sets `published_at`. A story needs a body and a collection at least one item to be published. |

### Media (any content permission, gate `media.upload`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/media` | paginated; `q` on alt text, credit, path |
| POST | `/admin/media` | multipart `file`: JPEG, PNG, WebP or GIF detected from the file **contents**, ≤ 5 MB, ≤ 8000×8000 px (SVG rejected); `alt_text?`, `credit?`, `source_url?` → 201. Stored on the `public` disk as `media/YYYY/MM/<ulid>.<ext>` — name and extension chosen by the server. Throttled 30/min. |
| PATCH | `/admin/media/{id}` | `alt_text`, `credit`, `source_url` |

Use the returned `id` as `cover_media_id` / `logo_media_id`.

### Users & roles (`users.manage`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | `q` (name/email), `role` |
| GET | `/admin/users/{id}` | id, name, email, phone, roles, permissions, `is_self`; never password or tokens |
| PUT | `/admin/users/{id}/roles` | `roles[]` (RoleName values) replaces the user's roles; USER is always kept. **403** when changing your own roles, or when anyone but a SUPER_ADMIN grants or revokes ADMIN/SUPER_ADMIN or edits an account holding either. Audited as `user.roles_changed`. |

### Monetization (`monetization.manage`)

Payments are **recorded by staff**; there is no payment gateway yet. Amounts are in paise (INR).

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/admin/plans` | `name`, `slug?`, `description?`, `price_paise`, `interval` (MONTH · YEAR · ONE_TIME), `features[]`, `is_active`, `sort_order`. List adds `subscriptions_count`, `active_subscriptions_count`. |
| GET/PATCH/DELETE | `/admin/plans/{id}`, `POST …/restore` | Soft delete; 422 while the plan has active subscriptions. |
| GET/POST | `/admin/subscriptions` | Filters `status`, `plan_id`, `business_id`, `q` (business name). Create: `business_id`, `plan_id`, `starts_on` (Y-m-d), optional `status`, `ends_on` (default: one billing period), `amount_paise` (default: plan price), `payment_method` (UPI · BANK_TRANSFER · CARD · CASH · CHEQUE · COMPLIMENTARY · OTHER), `payment_reference`, `paid_at` (IST, not in the future; requires a method), `notes`. |
| GET/PATCH | `/admin/subscriptions/{id}` | No delete — cancel instead, so history stays intact. All changes audited. |
| GET | `/admin/revenue?from=&to=` | Recorded payments only (`paid_at` in range, IST): `total_paise`, `payments`, `by_month[]`, `by_plan[]`, `by_method[]`, `mrr_paise` (active monthly/yearly normalised per month), `active_subscriptions`, `pending_subscriptions`, `upcoming_renewals` (next 30 days). Default range: last 12 months. |

### Analytics (`analytics.view`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/analytics?from=&to=` | From `analytics_events` (no IP/UA stored; visitor = daily-rotating hash). `totals` (events, page_views, visitors), `daily[]` (page_views, events, visitors), `by_event[]`, `top_pages[]`, `top_entities[]` (with names), `top_searches[]`. Default 30 days, max 366. |

### SEO & settings

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET/PUT | `/admin/settings/seo` | `seo.manage` | `site_name`, `title_template` (must contain `%s`), `home_title`, `home_description` (≤ 160), `default_description` (≤ 160), `default_image_media_id`, `allow_indexing`. |
| GET/PUT | `/admin/settings/social` | `settings.manage` | `facebook_url`, `instagram_url`, `x_url`, `youtube_url`, `linkedin_url`, `whatsapp_url` — https links on the matching domain only; `x_handle`. Shown in the footer and as `sameAs`. |
| GET/PUT | `/admin/settings/tracking` | `settings.manage` | IDs only, strictly validated: `ga4_measurement_id` (G-…), `gtm_container_id` (GTM-…), `meta_pixel_id` (digits), `clarity_project_id`, `google_site_verification`, `bing_site_verification`. Rendered into fixed snippets on public pages only (never `/admin`). |
| GET/POST | `/admin/seo` | `seo.manage` | Overrides. Filters `type` (`path` or a record type), `q`. Create with `path` (site/list/category page) **or** `entity_type` (business · place · event · story · collection · area) + `entity_id`; `title` ≤ 70, `description` ≤ 160, `image_media_id`, `noindex`. |
| PATCH/DELETE | `/admin/seo/{id}` | `seo.manage` | Target (`path`/entity) cannot change. |
| GET | `/admin/seo/entity/{type}/{id}` | `seo.manage` | Override for one record (or `null`). |
| GET | `/admin/seo/preview?path=` | `seo.manage` | Resolved metadata for any path, after overrides. |
| GET | `/admin/seo/audit` | `seo.manage` | Per type: public count, missing description (not covered by an override), missing cover image, titles > 60 chars, up to 10 examples. |

All settings changes are audited as `settings.{group}_updated` (changed keys only); overrides as `seo_meta.created/updated/deleted`.

### Site pages & legal details

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET/POST | `/admin/pages` | `pages.manage` | `title`, `slug?` (kebab-case, unique, not a reserved site route such as `login` or `events`), `summary?`, `body?` (HTML, sanitized like story bodies), `show_in_footer`, `sort_order`. New pages are DRAFT. |
| GET/PATCH/DELETE | `/admin/pages/{id}`, `POST …/restore` | `pages.manage` | `show` adds `meta.missing_legal_details`. |
| POST | `/admin/pages/{id}/status` | `pages.manage` | Publication workflow; a page needs a body to be published (409). |
| GET/PUT | `/admin/settings/legal` | `settings.manage` | `operator_name`, `contact_email`, `contact_phone`, `postal_address`, `grievance_officer_name`, `grievance_officer_email`, `jurisdiction_city`. Dashboard shows a “Setup needed” notice until the required ones are filled. |

### Audit log & dashboard

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/admin/audit-logs` | `audit.view` | Newest first. Filters: `action` (exact, or a prefix ending in `.` such as `business.`), `actor_id`, `auditable_type` (morph alias), `auditable_id`, `from`/`to` (Y-m-d, IST). Read-only: no update or delete routes. |
| GET | `/admin/dashboard` | any staff | Only sections the viewer may manage: counts by status for businesses, places, events (+ upcoming public), stories, collections; areas and categories; users; moderation queue sizes (pending reviews, submissions, claims; open reports); the last 10 audit entries (with `audit.view`). |

## Not yet implemented

Favorites, reviews (write), submissions, reports, owner portal, moderation screens for reviews/claims/submissions/reports, `/map`, `/nearby`, `/me/avatar`, `/me/*` lists, email verification — see [implementation-roadmap.md](implementation-roadmap.md).
