import fs from 'fs';
import path from 'path';

export interface Lead {
  id: string;
  timestamp: string;
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  city?: string;
  product_interest: string;
  message?: string;
  source: 'demo' | 'contact';
}

const LEADS_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(LEADS_DIR, 'leads.json');

function ensureLeadsFile() {
  if (!fs.existsSync(LEADS_DIR)) {
    fs.mkdirSync(LEADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, '[]', 'utf-8');
  }
}

export function storeLead(lead: Omit<Lead, 'id' | 'timestamp'>): Lead {
  ensureLeadsFile();

  const fullLead: Lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...lead,
  };

  const existing: Lead[] = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
  existing.push(fullLead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(existing, null, 2), 'utf-8');

  console.log('[Leads] Stored lead:', fullLead.id, fullLead.email);
  return fullLead;
}

export function getAllLeads(): Lead[] {
  ensureLeadsFile();
  return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
}
