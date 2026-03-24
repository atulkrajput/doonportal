# Analytics & Tracking — DoonPortal Phase 4

## Dashboard Analytics

Enhanced admin dashboard at `/admin` displays:

- Pipeline stats: total, new, contacted, demo_scheduled, converted, lost
- Conversion metrics: conversion rate, demo rate, response rate
- Active campaigns count
- Pending follow-ups count
- Leads by source (bar chart)
- Leads by product (bar chart)

## Conversion Tracking

- Lead lifecycle: lead → contacted → demo → converted
- Metrics calculated server-side:
  - Conversion Rate = (converted / total) × 100
  - Demo Rate = ((demo_scheduled + converted) / total) × 100
  - Response Rate = ((contacted + demo_scheduled + converted) / total) × 100

## Automation Rules

- Table: `automation_rules`
- Triggers: new_lead, no_contact_2days, demo_completed
- Actions: send_email, mark_followup, send_whatsapp
- Admin UI: `/admin/automation`
- Engine: `src/lib/automation.ts`

## Google Ads Preparation

- Landing page tracking events via `src/lib/analytics.ts`:
  - `trackLandingPageView(variant, page)`
  - `trackLandingPageConversion(variant, page, type)`
  - `trackGoogleAdsConversion(label, value)`
- Events pushed to GTM dataLayer
- Ready for Google Tag Manager and Google Ads conversion tracking

## Landing Page Variants

- Support for multiple landing page versions (e.g., /school-erp-v1, /school-erp-v2)
- Track performance per variant via analytics events
- Variant parameter included in form submissions

## Environment Variables

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_GA_ID | Google Analytics |
| NEXT_PUBLIC_GTM_ID | Google Tag Manager |
| NEXT_PUBLIC_META_PIXEL_ID | Meta Pixel |
| RESEND_API_KEY | Email sending |
| SALES_EMAIL | Sales notification recipient |
