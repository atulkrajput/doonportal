import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/campaigns/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(id) },
      include: {
        campaignLeads: {
          include: { lead: { select: { id: true, name: true, email: true, phone: true, status: true, city: true, organization: true } } },
        },
      },
    });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[API] GET /api/campaigns/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/campaigns/:id — update campaign
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, product, status } = body;

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (type) data.type = type;
    if (product) data.product = product;
    if (status) data.status = status;

    const campaign = await prisma.campaign.update({ where: { id: parseInt(id) }, data });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[API] PUT /api/campaigns/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campaigns/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.campaign.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/campaigns/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
