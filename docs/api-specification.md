# API Specification — `/api/v1`

JSON only. Single resources are wrapped in `data`; paginated lists return `{data, links, meta}` (Laravel paginator). Errors:

```json
{ "message": "The given data was invalid.", "errors": { "field": ["Validation message."] } }
```

Statuses used: 200, 201, 202, 204, 401, 404 (also for records the viewer may not see), 409 (invalid status transition), 422, 429.

Authentication: `Authorization: Bearer <token>` from register/login. Public endpoints accept a token optionally (editors can then see unpublished records).

Rate limits: `api` 120/min per user or IP; `auth` 10/min per IP and 5/min per email; `analytics` 60/min.

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

## Not yet implemented

Favorites, reviews (write), submissions, reports, owner portal, admin/moderation, `/map`, `/nearby`, `/me/avatar`, `/me/*` lists, email verification — see [implementation-roadmap.md](implementation-roadmap.md).
