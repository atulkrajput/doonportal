import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/leads/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
      include: {
        demoBookings: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        tags: true,
        whatsappLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('[API] GET /api/leads/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/leads/:id — update lead
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, name, organization, city, state, phone, email, message, productInterest, score, nextFollowupDate, followupStatus } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (name) data.name = name;
    if (organization !== undefined) data.organization = organization;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (phone !== undefined) data.phone = phone;
    if (email) data.email = email;
    if (message !== undefined) data.message = message;
    if (productInterest) data.productInterest = productInterest;
    if (score !== undefined) data.score = score;
    if (nextFollowupDate !== undefined) data.nextFollowupDate = nextFollowupDate ? new Date(nextFollowupDate) : null;
    if (followupStatus !== undefined) data.followupStatus = followupStatus;

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('[API] PUT /api/leads/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
