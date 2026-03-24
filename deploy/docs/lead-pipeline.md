# Lead Generation Pipeline — DoonPortal

## Overview

DoonPortal captures leads through demo request forms and contact forms across the website. Leads are stored locally and email notifications are sent to the sales team.

## Lead Capture Points

| Page | Form Type | Fields |
|------|-----------|--------|
| Home | Demo Form | Name, Organization, City, Phone, Email, Message |
| School Management | Demo Form | Name, Organization, City, Phone, Email, Message |
| Inventory POS | Demo Form | Name, Organization, City, Phone, Email, Message |
| Dairy Management | Demo Form | Name, Organization, City, Phone, Email, Message |
| Contact | Contact + Demo | Name, Email, Phone, Message / Full demo form |
| Book Demo | Demo Form | Name, Organization, City, Phone, Email, Message |

## Lead Flow

1. User fills out form on any page
2. Client-side validation (Zod schema via react-hook-form)
3. POST to `/api/demo` or `/api/contact`
4. Server-side validation
5. Lead stored in `data/leads.json`
6. Email notification sent to sales team
7. User redirected to `/thank-you` (demo forms) or shown success message (contact)

## Lead Storage

- File: `data/leads.json`
- Fields: id, timestamp, name, organization, email, phone, city, product_interest, message, source
- API endpoint: `GET /api/leads?key=<LEADS_API_KEY>`

## Email Notifications

- Sent via `src/lib/email.ts`
- Supports Resend API (set `RESEND_API_KEY`)
- Falls back to stub/logging in development
- Recipient: `SALES_EMAIL` env variable (default: sales@doonportal.com)

## Demo Request Pipeline

1. Lead captured → stored + email sent
2. User redirected to `/thank-you`
3. Thank-you page shows next steps + calendar booking option
4. Calendar integration via `NEXT_PUBLIC_CALENDLY_URL` env variable

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SALES_EMAIL` | Email recipient for lead notifications |
| `RESEND_API_KEY` | Resend API key for email sending |
| `EMAIL_FROM` | Sender email address |
| `LEADS_API_KEY` | API key for leads retrieval endpoint |
| `NEXT_PUBLIC_CALENDLY_URL` | Calendly booking URL for demo scheduling |

## Form Validation

- Name: required, min 1 char
- Organization: required (demo form)
- Email: valid email format
- Phone: digits only, min 10 digits (demo form)
- City: optional
- Message: optional (demo) / required (contact)
