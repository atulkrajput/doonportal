# Database Schema — DoonPortal CRM

## Database: MySQL

Connection: `DATABASE_URL` environment variable
ORM: Prisma 6

## Tables

### leads
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR | Required |
| organization | VARCHAR | Nullable |
| city | VARCHAR | Nullable, indexed |
| state | VARCHAR | Nullable |
| phone | VARCHAR | Nullable, indexed |
| email | VARCHAR | Required, indexed |
| message | TEXT | Nullable |
| product_interest | VARCHAR | school / inventory / dairy / custom / general |
| source | VARCHAR | website / ads / whatsapp / manual / imported |
| status | VARCHAR | new / contacted / demo_scheduled / converted / lost, indexed |
| score | INT | Default 0, lead scoring |
| next_followup_date | DATETIME | Nullable, follow-up scheduling |
| followup_status | VARCHAR | Nullable, pending / completed |
| created_at | DATETIME | Auto-set |
| updated_at | DATETIME | Auto-updated |

### lead_tags
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| lead_id | INT | Foreign key → leads.id, indexed |
| tag_name | VARCHAR | Indexed (hot/warm/cold/follow-up/not-interested/custom) |
| | | Unique constraint on (lead_id, tag_name) |

### campaigns
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR | Required |
| type | VARCHAR | email / whatsapp / ads / manual, indexed |
| product | VARCHAR | school / inventory / dairy |
| status | VARCHAR | active / paused / completed, indexed |
| created_at | DATETIME | Auto-set |

### campaign_leads
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| campaign_id | INT | Foreign key → campaigns.id, indexed |
| lead_id | INT | Foreign key → leads.id, indexed |
| assigned_at | DATETIME | Auto-set |
| | | Unique constraint on (campaign_id, lead_id) |

### email_templates
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR | Required |
| subject | VARCHAR | Required |
| body | TEXT | Required, supports HTML |
| created_at | DATETIME | Auto-set |

### whatsapp_logs
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| lead_id | INT | Foreign key → leads.id, indexed |
| message | TEXT | Required |
| status | VARCHAR | sent / delivered / failed, indexed |
| created_at | DATETIME | Auto-set |

### automation_rules
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR | Required |
| trigger | VARCHAR | new_lead / no_contact_2days / demo_completed |
| action | VARCHAR | send_email / mark_followup / send_whatsapp |
| template_id | INT | Nullable, reference to email template |
| enabled | BOOLEAN | Default true |
| created_at | DATETIME | Auto-set |

### demo_bookings
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| lead_id | INT | Foreign key → leads.id, indexed |
| scheduled_date | VARCHAR | Date string |
| scheduled_time | VARCHAR | Time string |
| meeting_link | VARCHAR | Nullable |
| notes | TEXT | Nullable |
| status | VARCHAR | scheduled / completed / cancelled, indexed |
| created_at | DATETIME | Auto-set |

### activities
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| lead_id | INT | Foreign key → leads.id, indexed |
| type | VARCHAR | call / email / whatsapp / meeting / score |
| notes | TEXT | Nullable |
| created_at | DATETIME | Auto-set |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR | Required |
| email | VARCHAR | Unique |
| password | VARCHAR | bcrypt hashed |
| role | VARCHAR | admin / sales |
| created_at | DATETIME | Auto-set |

## Indexes
- leads: email, phone, status, city, created_at
- lead_tags: lead_id, tag_name
- campaigns: status, type
- campaign_leads: campaign_id, lead_id
- whatsapp_logs: lead_id, status
- demo_bookings: lead_id, status, scheduled_date
- activities: lead_id
- users: email (unique)

## Setup
```bash
npx prisma migrate dev --name phase4
npx prisma generate
```
