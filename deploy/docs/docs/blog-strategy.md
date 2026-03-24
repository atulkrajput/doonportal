# Blog Strategy — DoonPortal

## Overview

The blog serves as the primary SEO content engine, targeting long-tail keywords and driving organic traffic to product pages through internal linking.

## Content Structure

Each blog post includes:
- SEO metadata (title, description, OG tags, Twitter cards, canonical URL)
- Table of contents (auto-generated from H2/H3 headings)
- Structured content with keyword-rich headings
- Internal links to product pages
- CTA section at the bottom (Book Demo + Explore Solutions)
- BlogPosting JSON-LD schema

## URL Structure

`/blog/[slug]` — e.g., `/blog/best-school-management-software-india`

## Current Blog Posts

| Post | Target Keywords | Product Link |
|------|----------------|--------------|
| Best School Management Software in India | school management software, school ERP | School Management |
| How School ERP Improves Administration | school ERP software, school automation | School Management |
| Why Schools Need ERP Software | school ERP, school management system | School Management |
| Benefits of Inventory Management Software | inventory management system, retail software | Inventory POS |
| Retail Inventory Management Best Practices | retail inventory, stock management | Inventory POS |
| Digital Transformation in Dairy Farming | dairy management, dairy automation | Dairy Management |
| Dairy Farm Automation Guide | dairy farm software, cattle management | Dairy Management |

## Content Guidelines

1. Target 1-2 primary keywords per post
2. Use primary keyword in H1, first paragraph, and meta description
3. Use secondary keywords in H2 headings
4. Include internal links to relevant product pages
5. End with a clear CTA (demo request or product page link)
6. Aim for 800-1500 words per post
7. Use descriptive image alt tags

## Blog Infrastructure

- Markdown files in `content/blog/`
- Frontmatter: title, excerpt, author, date, featuredImage, tags
- Processed by `src/lib/blog.ts` using gray-matter
- Pagination: 9 posts per page
- Dynamic routes with `generateStaticParams()`

## Internal Linking Strategy

- Blog → Product pages (via inline links and bottom CTA)
- Product pages → Related blog posts (via "Related Resources" section)
- Blog listing → Individual posts
- Home page → Blog section (via navigation)
