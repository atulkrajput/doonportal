# Lead Flow — DoonPortal CRM

## Lead Capture Flow

```
User visits website
    ↓
Fills form (Home / School / Inventory / Dairy / Contact / Book Demo)
    ↓
Client-side validation (Zod + react-hook-form)
    ↓
POST to /api/demo or /api/contact
    ↓
Server-side validation
    ↓
Lead created in MySQL (status: "new")
    ↓
Email notification sent to sales team
    ↓
User redirected to /thank-you
```

## Product Interest Mapping

| Page | product_interest |
|------|-----------------|
| School Management | school |
| Inventory POS | inventory |
| Dairy Management | dairy |
| Contact / General | general |
| Custom Automation | custom |

## Pipeline Stages

```
new → contacted → demo_scheduled → converted
                                  ↘ lost
```

| Stage | Description |
|-------|-------------|
| new | Lead just captured, not yet contacted |
| contacted | Sales team has reached out |
| demo_scheduled | Demo meeting booked |
| converted | Deal closed |
| lost | Lead did not convert |

## Admin Workflow

1. New lead appears in dashboard with "new" badge
2. Sales rep opens lead detail, reviews info
3. Updates status to "contacted" after first outreach
4. Logs activity (call, email, whatsapp, meeting)
5. Schedules demo → status becomes "demo_scheduled"
6. After demo, marks as "converted" or "lost"

## Notification Triggers

- New lead created → email to SALES_EMAIL
- Demo booking created → email to SALES_EMAIL

## Form Integration Points

All CTA buttons on the website connect to forms that feed into this pipeline:
- "Request Demo" buttons → DemoForm → /api/demo
- "Contact Us" → ContactForm → /api/contact
- "Book Demo" page → DemoForm → /api/demo
