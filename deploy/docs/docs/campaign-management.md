# Campaign Management — DoonPortal Phase 4

## Overview

Campaigns organize leads into targeted groups for outreach and tracking.

## Campaign Model

- Table: `campaigns`
- Fields: name, type, product, status, created_at
- Types: email, whatsapp, ads, manual
- Products: school, inventory, dairy
- Statuses: active, paused, completed

## Campaign-Lead Assignment

- Table: `campaign_leads` (campaign_id, lead_id)
- Many-to-many relationship
- Assign leads: `POST /api/campaigns/:id/leads` with `{ lead_ids: [1,2,3] }`
- Remove lead: `DELETE /api/campaigns/:id/leads` with `{ lead_id: 1 }`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/campaigns | List campaigns (filter by status, type) |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns/:id | Campaign detail with assigned leads |
| PUT | /api/campaigns/:id | Update campaign |
| DELETE | /api/campaigns/:id | Delete campaign |
| POST | /api/campaigns/:id/leads | Assign leads |
| DELETE | /api/campaigns/:id/leads | Remove lead |

## Admin UI

- Campaign list: `/admin/campaigns`
- Campaign detail: `/admin/campaigns/:id`
- Create campaign with name, type, product
- Update status (active/paused/completed)
- View and manage assigned leads
