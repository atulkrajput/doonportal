# Analytics Setup — DoonPortal

## Overview

DoonPortal supports Google Analytics, Google Tag Manager, and Meta Pixel. All analytics are loaded conditionally based on environment variables.

## Configuration

Set these environment variables to enable analytics:

| Variable | Service |
|----------|---------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics (e.g., G-XXXXXXXXXX) |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (e.g., GTM-XXXXXXX) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta/Facebook Pixel ID |

If `GTM_ID` is set, GA is loaded through GTM (not separately).

## Implementation

### Analytics Provider
- Component: `src/components/analytics/AnalyticsProvider.tsx`
- Loaded in root layout (`src/app/layout.tsx`)
- Uses `next/script` with `afterInteractive` strategy for performance

### Event Tracking
- Utility: `src/lib/analytics.ts`
- Functions:
  - `trackEvent(name, params)` — Generic event tracking (GA + GTM + Meta)
  - `trackFormSubmission(type, product)` — Form submission + Meta Lead event
  - `trackDemoRequest(product)` — Demo request + Meta Schedule event
  - `trackCTAClick(label, location)` — CTA button click tracking

## Tracked Events

| Event | Trigger | Platforms |
|-------|---------|-----------|
| `form_submission` | Demo or contact form submitted | GA, GTM, Meta |
| `demo_request` | Demo form submitted | GA, GTM, Meta |
| `cta_click` | CTA button clicked | GA, GTM, Meta |
| `Lead` (Meta) | Any form submission | Meta Pixel |
| `Schedule` (Meta) | Demo request | Meta Pixel |
| `PageView` (Meta) | Every page load | Meta Pixel |

## GTM Data Layer

Events are pushed to `window.dataLayer` for GTM processing. Custom triggers can be configured in GTM based on event names.

## Testing

1. Set env variables in `.env.local`
2. Use browser dev tools Network tab to verify script loading
3. Use Google Tag Assistant or Meta Pixel Helper browser extensions
4. Check GTM preview mode for data layer events
