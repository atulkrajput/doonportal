import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/followups — list pending follow-ups
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const where: Record<string, unknown> = {
      nextFollowupDate: { not: null },
    };

    if (status === 'pending') {
      where.OR = [{ followupStatus: 'pending' }, { followupStatus: null }];
    } else if (status === 'completed') {
      where.followupStatus = 'completed';
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { nextFollowupDate: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organization: true,
        city: true,
        status: true,
        nextFollowupDate: true,
        followupStatus: true,
        score: true,
        tags: true,
      },
    });

    return NextResponse.json({ followups: leads });
  } catch (error) {
    console.error('[API] GET /api/followups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
