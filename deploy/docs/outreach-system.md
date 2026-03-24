# Outreach System — DoonPortal Phase 4

## Overview

The outreach system enables bulk and individual communication with leads via email and WhatsApp.

## Email Outreach

- Endpoint: `POST /api/outreach/email`
- Send to multiple leads at once
- Template-based or custom emails
- Personalization: `{{name}}`, `{{organization}}`
- Activities logged automatically
- Lead score incremented (+2) on send

### Email Templates

- Table: `email_templates` (name, subject, body)
- CRUD: `/api/email-templates`
- Example templates:
  1. School Demo Invitation
  2. Follow-up after demo
  3. Reminder message

## WhatsApp Outreach (API-Ready)

- Endpoint: `POST /api/outreach/whatsapp`
- Messages logged in `whatsapp_logs` table
- Personalization: `{{name}}`, `{{organization}}`
- Activities logged automatically
- Ready for WhatsApp Business API integration
- Logs: `GET /api/outreach/whatsapp?lead_id=X`

## Cold Outreach Panel

- Admin page: `/admin/outreach`
- Search leads by name, email, organization
- Filter by city, tag
- Select leads and send email or WhatsApp
- Template selection for emails

## Integration Points

- Email: Resend API (set RESEND_API_KEY) or stub
- WhatsApp: Replace stub in `/api/outreach/whatsapp` with actual API
- All messages logged as activities on lead timeline
