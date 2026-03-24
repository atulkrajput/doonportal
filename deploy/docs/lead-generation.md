# Lead Generation System — DoonPortal Phase 4

## Overview

The lead generation system enables DoonPortal to capture, import, tag, score, and manage leads at scale. Primary target: School Management System.

## Lead Import

- Endpoint: `POST /api/leads/import`
- Accepts JSON array of leads parsed from CSV
- Fields: school_name, contact_person, phone, email, city, state, source
- Source defaults to "imported"
- Duplicates are skipped gracefully

### CSV Format
```
school_name,contact_person,phone,email,city,state,source
ABC School,John Doe,9876543210,john@abc.edu,Dehradun,Uttarakhand,imported
```

## Lead Tagging

- Table: `lead_tags` (lead_id, tag_name)
- Preset tags: hot, warm, cold, follow-up, not-interested
- Custom tags supported
- Multiple tags per lead
- API: `POST/DELETE /api/leads/:id/tags`

## Lead Scoring

- Score stored on lead record
- Scoring actions:
  - +10: Filled demo form
  - +5: Opened email
  - +15: Scheduled demo
  - -5: No response
- API: `POST /api/leads/:id/score`
- Auto-incremented on email outreach (+2)

## Lead Export

- Endpoint: `GET /api/leads/export`
- Returns CSV download
- Supports filters: status, city, tag

## Follow-up System

- Fields: next_followup_date, followup_status (pending/completed)
- API: `PUT /api/leads/:id/followup`
- Follow-ups list: `GET /api/followups?status=pending`
- Overdue follow-ups highlighted in UI

## Local Targeting

- Filter leads by city, state
- Useful for targeting nearby schools
- Available in leads list and outreach panel

## Data Indexes

- email, phone, status, city, created_at on leads table
- tag_name on lead_tags table
