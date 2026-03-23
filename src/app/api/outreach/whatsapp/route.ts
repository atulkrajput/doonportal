import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/outreach/whatsapp — send/log WhatsApp message
export async function POST(req: NextRequest) {
  try {
    const { lead_id, message, lead_ids } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const ids = lead_ids || (lead_id ? [lead_id] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'lead_id or lead_ids is required' }, { status: 400 });
    }

    let sent = 0;
    for (const id of ids) {
      const lead = await prisma.lead.findUnique({ where: { id: parseInt(String(id)) } });
      if (!lead) continue;

      // Personalize message
      const personalizedMsg = message
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{organization\}\}/g, lead.organization || '');

      // Log the WhatsApp message (API-ready — replace with actual API call)
      await prisma.whatsappLog.create({
        data: { leadId: lead.id, message: personalizedMsg, status: 'sent' },
      });

      // Log activity
      await prisma.activity.create({
        data: { leadId: lead.id, type: 'whatsapp', notes: `WhatsApp: ${personalizedMsg.substring(0, 100)}` },
      });

      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('[API] POST /api/outreach/whatsapp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/outreach/whatsapp — get WhatsApp logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('lead_id');

    const where: Record<string, unknown> = {};
    if (leadId) where.leadId = parseInt(leadId);

    const logs = await prisma.whatsappLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { lead: { select: { name: true, phone: true } } },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[API] GET /api/outreach/whatsapp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
