import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/activity — log activity on a lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, type, notes } = body;

    if (!lead_id || !type) {
      return NextResponse.json({ error: 'lead_id and type are required' }, { status: 400 });
    }

    const validTypes = ['call', 'email', 'whatsapp', 'meeting'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        leadId: parseInt(lead_id),
        type,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
