import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/campaigns — create campaign
export async function POST(req: NextRequest) {
  try {
    const { name, type, product, status } = await req.json();
    if (!name || !type || !product) {
      return NextResponse.json({ error: 'name, type, and product are required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: { name, type, product, status: status || 'active' },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/campaigns — list campaigns
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { campaignLeads: true } } },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('[API] GET /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
