import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/campaigns/:id/leads — assign leads to campaign
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { lead_ids } = await req.json();
    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 });
    }

    let added = 0;
    for (const leadId of lead_ids) {
      try {
        await prisma.campaignLead.create({
          data: { campaignId: parseInt(id), leadId: parseInt(leadId) },
        });
        added++;
      } catch {
        // skip duplicates
      }
    }

    return NextResponse.json({ success: true, added });
  } catch (error) {
    console.error('[API] POST /api/campaigns/:id/leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campaigns/:id/leads — remove lead from campaign
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { lead_id } = await req.json();

    await prisma.campaignLead.deleteMany({
      where: { campaignId: parseInt(id), leadId: parseInt(lead_id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/campaigns/:id/leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
