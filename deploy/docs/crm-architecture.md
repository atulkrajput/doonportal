# CRM Architecture — DoonPortal

## Overview

DoonPortal CRM is a lead management and sales pipeline system built on top of the existing Next.js website. It captures leads from website forms, tracks them through pipeline stages, manages demo bookings, and provides an admin dashboard for the sales team.

## Tech Stack

- Next.js 14 (App Router, API Routes)
- TypeScript
- MySQL (via Prisma ORM)
- Tailwind CSS
- bcryptjs (password hashing)
- jsonwebtoken (session management)

## Architecture

```
Website Forms → API Routes → MySQL (Prisma) → Admin Dashboard
     ↓                ↓
  /thank-you    Email Notification
```

## Key Components

### Lead Capture
- DemoForm and ContactForm submit to `/api/demo` and `/api/contact`
- Product interest is auto-detected from form context
- Leads are stored in MySQL with status "new"
- Email notification sent to sales team

### Admin Dashboard (/admin)
- Protected by JWT-based authentication
- Sidebar navigation: Dashboard, Leads, Demos, Activities
- Dashboard shows pipeline stats at a glance

### Pipeline Stages
- new → contacted → demo_scheduled → converted → lost
- Status can be updated from the lead detail page

### Demo Booking
- Created alongside leads or separately
- Tracks scheduled date, time, meeting link, status

### Activity Tracking
- Log calls, emails, WhatsApp messages, meetings per lead
- Timeline view on lead detail page

## Authentication
- JWT tokens stored in httpOnly cookies
- Default admin: admin@doonportal.com / admin123 (auto-seeded)
- Protected routes redirect to /admin/login

## Future Integration Points
- WhatsApp API: activity type already supports "whatsapp"
- SMS API: add new activity type
- Email automation: extend sendEmail utility
- Calendly: NEXT_PUBLIC_CALENDLY_URL env variable
