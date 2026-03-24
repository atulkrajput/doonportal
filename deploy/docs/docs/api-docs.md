# API Documentation — DoonPortal CRM

## Base URL
`/api`

---

## Leads

### POST /api/leads
Create a new lead.

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "organization": "string",
  "city": "string",
  "phone": "string",
  "message": "string",
  "product_interest": "school | inventory | dairy | custom | general",
  "source": "website | ads | whatsapp | manual"
}
```

**Response:** `201 Created`
```json
{ "success": true, "lead": { "id": 1 } }
```

### GET /api/leads
List leads with filters.

**Query params:**
- `status` — filter by status (new, contacted, demo_scheduled, converted, lost)
- `search` — search name, email, organization, phone
- `sort` — asc or desc (default: desc)
- `page` — page number (default: 1)
- `limit` — items per page (default: 50)

**Response:** `200 OK`
```json
{ "leads": [...], "total": 100, "page": 1, "limit": 50 }
```

### GET /api/leads/:id
Get single lead with activities and demo bookings.

### PUT /api/leads/:id
Update lead fields (status, name, email, etc).

---

## Demo Bookings

### POST /api/demo
Create lead from demo form, optionally with booking.

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "organization": "string",
  "city": "string",
  "phone": "string",
  "message": "string",
  "product_interest": "string",
  "scheduled_date": "string (optional)",
  "scheduled_time": "string (optional)"
}
```

### GET /api/demo
List demo bookings. Optional `?status=scheduled|completed|cancelled`.

### PUT /api/demo/:id
Update booking status, meeting link, notes.

---

## Activities

### POST /api/activity
Log an activity on a lead.

**Body:**
```json
{
  "lead_id": "number (required)",
  "type": "call | email | whatsapp | meeting (required)",
  "notes": "string"
}
```

---

## Contact

### POST /api/contact
Create lead from contact form.

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string",
  "message": "string (required)"
}
```

---

## Auth

### POST /api/auth/login
**Body:** `{ "email": "string", "password": "string" }`
**Response:** Sets httpOnly cookie `dp_admin_token`.

### POST /api/auth/logout
Clears auth cookie.

### GET /api/auth/me
Returns current authenticated user or 401.

---

## Admin

### GET /api/admin/stats
Dashboard statistics (lead counts by status, demo count, activity count).

### GET /api/admin/activities
Recent activities with lead info.
