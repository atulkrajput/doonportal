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

### Audit log & dashboard

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/admin/audit-logs` | `audit.view` | Newest first. Filters: `action` (exact, or a prefix ending in `.` such as `business.`), `actor_id`, `auditable_type` (morph alias), `auditable_id`, `from`/`to` (Y-m-d, IST). Read-only: no update or delete routes. |
| GET | `/admin/dashboard` | any staff | Only sections the viewer may manage: counts by status for businesses, places, events (+ upcoming public), stories, collections; areas and categories; users; moderation queue sizes (pending reviews, submissions, claims; open reports); the last 10 audit entries (with `audit.view`). |

## Not yet implemented

Favorites, reviews (write), submissions, reports, owner portal, moderation screens for reviews/claims/submissions/reports, `/map`, `/nearby`, `/me/avatar`, `/me/*` lists, email verification — see [implementation-roadmap.md](implementation-roadmap.md).
