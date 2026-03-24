# SEO Architecture — DoonPortal

## Overview

DoonPortal uses Next.js App Router with built-in SEO capabilities. All SEO metadata is centralized in `src/data/seo.ts` and applied per-page via `generateMetadata()` and `PageLayout`.

## Technical SEO

### Metadata Structure
- Every page has: title, description, keywords, Open Graph tags, Twitter cards, canonical URL
- Title template: `%s | DoonPortal Automation Software`
- Root layout sets default metadata with `metadataBase`

### Sitemap
- Auto-generated at `/sitemap.xml` via `src/app/sitemap.ts`
- Includes all static pages + dynamic blog posts
- Priority: Home (1.0) > School Management (0.95) > Products (0.9) > Blog listing (0.8) > Blog posts (0.6)

### Robots.txt
- Generated at `/robots.txt` via `src/app/robots.ts`
- Allows all crawlers on `/`
- Disallows: `/api/`, `/admin/`, `/private/`, `/test/`, `/_next/`

### Structured Data (JSON-LD)
- Organization schema on home page
- SoftwareApplication schema on product pages
- Product schema on product pages
- BreadcrumbList schema on all pages
- BlogPosting schema on blog posts
- TechArticle builder available for technical content

### Canonical URLs
- Set via `alternates.canonical` in `generateMetadata()`
- Also stored in `pageSEO` entries

## On-Page SEO Structure

Every product page follows this H-tag hierarchy:
- H1 — Primary keyword (e.g., "School Management Software")
- H2 — Problems / Challenges
- H2 — Solution
- H2 — Features
- H2 — Screenshots
- H2 — Benefits
- H2 — How It Works
- H2 — Request Demo

## Keyword Targeting

### School Management Page
- school management software
- school ERP software
- school automation system
- school management system India

### Inventory POS Page
- inventory management system
- POS software for retail
- retail inventory software

### Dairy Management Page
- dairy farm management software
- milk production management system
- cattle management software

## Image SEO
- All images use descriptive `alt` tags
- Next.js Image component handles AVIF/WebP format optimization
- 30-day cache TTL for images

## Internal Linking
- Product pages link to related blog posts
- Blog posts link to product pages via CTAs
- Footer contains links to all major pages
- Navigation dropdown links to all products

## Performance
- Next.js automatic code splitting
- Image optimization with AVIF/WebP
- Font optimization with `next/font`
- Static asset caching headers (1 year)
- Compression enabled
