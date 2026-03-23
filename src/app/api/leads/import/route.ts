import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/leads/import — bulk import leads from CSV/JSON
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leads } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'leads array is required' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of leads) {
      const { school_name, contact_person, phone, email, city, state, source } = row;
      if (!email || !contact_person) {
        skipped++;
        errors.push(`Skipped: missing email or contact_person`);
        continue;
      }
      try {
        await prisma.lead.create({
          data: {
            name: contact_person,
            organization: school_name || null,
            city: city || null,
            state: state || null,
            phone: phone || null,
            email,
            productInterest: 'school',
            source: source || 'imported',
            status: 'new',
          },
        });
        imported++;
      } catch {
        skipped++;
        errors.push(`Skipped: ${email} (duplicate or error)`);
      }
    }

    return NextResponse.json({ success: true, imported, skipped, errors: errors.slice(0, 10) });
  } catch (error) {
    console.error('[API] POST /api/leads/import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
