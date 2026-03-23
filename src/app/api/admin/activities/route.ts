import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { lead: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('[API] GET /api/admin/activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
