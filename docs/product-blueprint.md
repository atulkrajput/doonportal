# DoonPortal — Product Blueprint

> Source of truth for product scope, condensed from the master agentic development blueprint (2026-10-19).
> The agent operating instructions from that blueprint live in [implementation-roadmap.md](implementation-roadmap.md).
> Implementation decisions that deviate from it are recorded in [architecture.md](architecture.md) under "Decisions".

**Brand:** DOONPORTAL — ALL THINGS DOON.
**Tagline:** Discover. Connect. Belong.
**Mission:** Build the digital home of Dehradun: a comprehensive, searchable, trusted, self-updating city ecosystem.

**Strategic principle:** Build the data and trust layer first. Automate its maintenance second. Build increasingly intelligent discovery experiences on top.

---

## 1. What is DoonPortal?

A digital city platform for Dehradun, Uttarakhand — not merely a news site, tourism portal or directory. It connects structured city data, local discovery, businesses, events, editorial content, neighbourhoods and community participation.

**Audiences:** residents, visitors, business owners, event organizers, local creators/journalists, people interested in Doon's history and culture.

**Differentiators:** structured reusable local data; strong business and place profiles; accurate events; neighbourhood discovery; editorial content linked to real entities; community contributions and corrections; owner tools; transparent verification and source provenance; an AI-assisted data engine; natural-language discovery over trusted records. Never copy competitors' protected content or data.

## 2. Product pillars

1. **Explore** — places, attractions, things to do
2. **Eat** — restaurants, cafes, bakeries, local food
3. **Shop** — markets, stores, local brands
4. **Services** — home, professional, automotive, education, lifestyle, healthcare
5. **Events** — upcoming events, workshops, performances, community activities
6. **Stories** — news, guides, interviews, heritage, editorial
7. **Community** — reviews, photos, corrections, submissions
8. **New in Doon** — new businesses, openings, coming soon
9. **Best of Doon** — curated collections of real entities
10. **Doon Map** — location-based exploration
11. **Business Portal** — claims, profiles, promotions, analytics
12. **AI Data Engine** — automated discovery, extraction, validation, updating
13. **Doon AI** — natural-language search and personalised discovery

## 3. Navigation and homepage

- Desktop: `DOONPORTAL | Explore | Eat | Shop | Services | Events | Stories | Search Doon | Business`
- Mobile: `Home | Explore | Search | Events | Saved`
- Homepage sections: hero ("ALL THINGS DOON. Discover. Connect. Belong."), cross-entity search, quick links (Cafes, Restaurants, Events, Places, Services), Explore Doon categories, What's Happening, Popular, New in Doon, Eat in Doon, Explore by Area, Doon Stories, Doon Map preview, Best of Doon, List Your Business, footer.
- All sections use live API data with sensible empty states. Never present static demo content as live information.

## 4. Business directory

Profile fields (where available): name/slug, logo, cover, description, categories, services, address, coordinates, neighbourhood, contact, website/social, opening hours + exceptions, price range, amenities, payment methods, photos/menus, offers, upcoming events, reviews + aggregates, verification status/date, claim status, related/nearby, source and last-verified metadata.

Actions: Call, WhatsApp, Directions, Website, Email, Save, Review, Report incorrect information.

Statuses: `UNVERIFIED → SUBMITTED → UNDER_REVIEW → VERIFIED`, plus CLAIMED, SUSPENDED, CLOSED, with defined transitions and audit. **A business is never labelled verified solely because AI found it online.**

## 5. Places and attractions

Attractions, parks/gardens, waterfalls/nature, lakes/viewpoints, temples/monasteries, museums/heritage, photography/picnic spots, walking/recreation. Fields: description, photos, coordinates, area, category, hours, entry fees, facilities, accessibility, parking, best visiting times, verified nearby entities.

## 6. Food and shopping

Food: restaurants, cafes, bakeries, street food, desserts, cloud kitchens, bars/pubs, veg/vegan/non-veg, fine dining/budget, local cuisine. Filters: area, cuisine, price, rating, open now, outdoor seating, parking, family/work friendly.
Shopping: fashion, jewellery, electronics, furniture, grocery, local brands, gifts, markets/malls.

## 7. Services and healthcare

Home (electricians, plumbers, carpenters, AC/RO repair, cleaning/pest control); professional (accountants, lawyers, architects, interior designers, photographers, digital agencies, consultants); lifestyle/automotive (salons, spas, gyms, yoga, dance, dealers, service centres, tyres, detailing); education (schools, colleges, coaching, tuition, training); healthcare (hospitals, clinics, doctors, dentists, diagnostics, pharmacies).
**Healthcare needs especially careful verification. Never generate qualifications, treatment claims, ratings or availability without evidence.**

## 8. Events

Structured records: title, description, cover, start/end with explicit time zone, venue/location, organizer, categories, price/free, ticket URL, age restrictions, contact, images, sources, publication + event status.
Categories: music, comedy, theatre, workshops, kids, sports, food, exhibitions, networking, cultural, spiritual, educational, community.
Lifecycle: `DRAFT → SUBMITTED → REVIEW → PUBLISHED → UPCOMING → LIVE → COMPLETED → ARCHIVED`, plus cancellation and rescheduling. **Never publish an event as upcoming without validating its date and year.**

## 9. Areas and neighbourhoods

Rajpur Road, Jakhan, Malsi, Dalanwala, Race Course, Vasant Vihar, Clement Town, Raipur, Prem Nagar, Patel Nagar, Sahastradhara Road, GMS Road, Ballupur (and others as justified). Area pages: overview, businesses, places, shopping, services, events, stories, map, new businesses, guides. No thin/repetitive SEO pages.

## 10. Stories, heritage and collections

Types: story, guide, list, news, interview, heritage feature, collection. Themes: People of Doon, local entrepreneurs, food and local brands, artists/creators, startups, schools/sports, culture/environment, Old Doon/heritage.
Collections (Best Cafes, Best Restaurants, Places for Families, Sunset Spots, …) reference real entities with selection criteria. AI-generated editorial must be based on verified records and go through the publishing workflow.

## 11. Technical architecture (summary)

- Backend: Laravel REST API (`/api/v1`), Sanctum, queues, scheduler, Policies, Form Requests, API Resources, services; Redis when justified.
- Frontend: React, React Router, centralized API client, URL-driven filters, SEO-capable rendering.
- Database: ULID keys, FKs, unique slugs, indexes from access patterns, soft deletes where useful, JSON for flexible metadata only, money in integer minor units, UTC timestamps + explicit event time zones, controlled polymorphic maps, audit history, AI provenance separate from public fields, transactions for publication.
- Infrastructure: object storage/CDN, configurable mail and AI providers, logging/monitoring, backups, staging + production, CI.

## 12. Database scope

Identity/RBAC (`users`, `roles`, `permissions`, `role_user`, `permission_role`; roles SUPER_ADMIN, ADMIN, EDITOR, MODERATOR, BUSINESS_OWNER, CONTRIBUTOR, USER); shared (`media`, `locations`, `areas`, `categories`); businesses (`businesses`, `business_category`, `business_area`, `business_services`, `business_hours`, `business_photos`, `business_social_links`, `offers`, `business_claims`); places (`places`, `place_category`, `place_area`, `place_photos`, `place_facilities`); events (`venues`, `organizers`, `organizer_business`, `events`, `event_categories`); editorial (`stories`, `story_category`, `story_entities`, `collections`, `collection_items`); community (`reviews`, `review_votes`, `favorites`, `submissions`, `reports`); monetization (`plans`, `features`, `plan_features`, `subscriptions`, `subscription_items`, `payments`, `advertisements`); operations (`analytics_events`, `notifications`, `audit_logs`); AI engine (`ai_sources`, `ai_source_runs`, `ai_discovered_items`, `ai_extractions`, `ai_validation_results`, `ai_entity_matches`, `ai_confidence_scores`, `ai_ingestion_jobs`, `ai_content_changes`).

AI schema detail: see [ai-data-engine.md](ai-data-engine.md).

## 13. API scope

Conventions: base `/api/v1`, JSON, `{message, errors}` errors, statuses 200/201/204/400/401/403/404/409/422/429/500, allowlisted sort, default page size 20 (max 100). Never expose hashes, private verification details, prompts, secrets or private audit data.

- Public discovery: `/home`, `/search`, `/businesses[/{slug}[/photos|services|offers|reviews|related]]`, `/places[/{slug}[/photos|related]]`, `/events[/{slug}[/related]]`, `/areas[/{slug}[/businesses|places|events|stories]]`, `/categories[/{slug}]`, `/stories[/{slug}]`, `/collections[/{slug}]`.
- Auth/user: `/auth/register|login|logout|forgot-password|reset-password|me`, `/me` (GET/PATCH), `/me/avatar`, `/me/favorites`, `/favorites` (POST/DELETE), `/me/reviews`, `/me/submissions`, `/me/notifications`.
- Reviews & submissions: 1–5 ratings, duplicate prevention, moderation, safe aggregate recalculation; business/place/event/correction/photo submissions each with their own schema; approval goes through domain services.
- Business owner: owned businesses, profile, photos, services/menu, hours, social links, offers, reviews, leads, analytics — ownership from verified claims only.
- Admin/moderation: dashboard, all content types, users, reviews, submissions, reports, claims, offers/ads, subscriptions, analytics, AI sources/runs/review queue/content changes — with filtering, pagination, safe bulk operations and audit logging.
- Map: `/map`, `/nearby` with validated coordinates/radius/bounds and limits.
- Analytics: `POST /analytics/events` with allowlisted names (`search_performed`, `business_viewed`, `business_phone_clicked`, `business_whatsapp_clicked`, `directions_clicked`, `business_website_clicked`, `event_viewed`, `event_ticket_clicked`, `place_viewed`, `story_read`, `business_saved`, `event_saved`, `review_submitted`, `business_claimed`, `offer_clicked`), rate-limited, minimal data.

## 14. Roadmap

| Phase | Scope |
|---|---|
| 0 | Foundation: Laravel + React, env, DB, `/api/v1`, auth + RBAC, layout, tests, logging, docs |
| 1 | Database and core entities, models, factories, demo seeders, policies, ERD |
| 2 | Public website and discovery (home, search, listings, details, areas, categories, stories, collections, SEO metadata, states) |
| 3 | Admin panel and CMS |
| 4 | Business owner portal |
| 5 | Community and reviews (saves, submissions, photos, reviews, reports, My DoonPortal) |
| 6 | Stories, New in Doon, Best of Doon (editorial CMS + workflow) |
| 7 | Doon Map (provider abstraction, layers, clustering, nearby) |
| 8 | Monetization (plans, entitlements, subscriptions, payments, webhooks) — no real collection until legal/security complete |
| 9 | SEO, performance, analytics dashboards |
| 10 | Search and recommendations (ranking service; PostgreSQL search first) |
| 11 | Notifications and PWA |
| 12 | Security hardening |
| 13 | QA and launch |
| 14 | AI Data Engine |
| 15 | Doon AI (grounded natural-language discovery) |

## 15. AI Data Engine (Phase 14) — summary

Pipeline: `DISCOVER → FETCH → EXTRACT → CLASSIFY → VALIDATE → MATCH → SCORE → REVIEW OR AUTO-PUBLISH → AUDIT → REFRESH`. AI never writes directly to production tables; schema-constrained output goes through validation, deduplication, confidence scoring and domain services. Full requirements: [ai-data-engine.md](ai-data-engine.md).

## 16. Search, SEO, map

- URLs: `/businesses/`, `/businesses/{category}/`, `/business/{slug}/`, `/places/`, `/places/{category}/`, `/place/{slug}/`, `/events/`, `/event/{slug}/`, `/areas/`, `/area/{slug}/`, `/stories/`, `/guide/{slug}/`.
- Canonicals, breadcrumbs, Open Graph, sitemap, redirects, useful 404s; structured data (LocalBusiness, Restaurant, Event, Article, Place, BreadcrumbList) only when the record supports the claims.
- Ranking as a dedicated service; sponsored placement is labelled and never overrides relevance safeguards.
- Map providers configurable; request location only when needed.
- Doon AI only after the data engine and discovery APIs are stable; answers grounded in real entities, no invented availability/hours/prices/dates.

## 17. Business model

Free listing (basic profile, contact, map, limited photos); Pro (featured eligibility, more photos, offers, social links, analytics, priority support; illustrative ₹499–₹999/month); Premium (homepage placement, category sponsorship, featured content, event promotion, campaigns, advanced lead analytics; ₹1,999+/month). Other revenue: sponsored stories/events, local brand campaigns, display ads. All pricing and entitlements configurable.

## 18. Testing and production

Backend unit/feature/authorization/constraint tests including claims, events, moderation, deduplication, AI validation/scoring/publishing, idempotent queues, change revert, entitlements, webhooks. Frontend component/form/state/filter/responsive/authorization tests. End-to-end flows for submissions, claims, events, reviews, AI ingestion and search.
Production: controlled migrations, queue workers, scheduler, HTTPS/CORS, backups + restore drills, monitoring, storage/CDN, mail, AI credentials + spend limits, separate staging, rollback and incident docs. Auto-publishing stays off in production until source policies, confidence rules, rollback and monitoring are tested.

## 19. Definition of success

Residents and visitors find accurate local information, businesses manage their presence, contributors improve the database, administrators supervise efficiently. The AI engine keeps finding, validating, de-duplicating and updating information with a transparent review trail, and the user-facing AI answers from reliable structured data rather than invention. The lasting advantage is the depth, freshness, accuracy and trustworthiness of the structured city database.
