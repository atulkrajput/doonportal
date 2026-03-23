import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/leads/:id/followup — set/update follow-up
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { next_followup_date, followup_status } = await req.json();

    const data: Record<string, unknown> = {};
    if (next_followup_date) data.nextFollowupDate = new Date(next_followup_date);
    if (followup_status) data.followupStatus = followup_status;

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('[API] PUT /api/leads/:id/followup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
