import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/leads/:id/score — adjust lead score
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { delta, reason } = await req.json();
    if (typeof delta !== 'number') return NextResponse.json({ error: 'delta (number) is required' }, { status: 400 });

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: { score: { increment: delta } },
    });

    // Log scoring activity
    await prisma.activity.create({
      data: {
        leadId: parseInt(id),
        type: 'score',
        notes: `Score ${delta > 0 ? '+' : ''}${delta}: ${reason || 'manual adjustment'}`,
      },
    });

    return NextResponse.json({ score: lead.score });
  } catch (error) {
    console.error('[API] POST /api/leads/:id/score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
