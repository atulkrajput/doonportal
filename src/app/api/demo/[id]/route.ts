import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/demo/:id — update demo booking status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, meeting_link, notes } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (meeting_link !== undefined) data.meetingLink = meeting_link;
    if (notes !== undefined) data.notes = notes;

    const booking = await prisma.demoBooking.update({
      where: { id: parseInt(id) },
      data,
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('[API] PUT /api/demo/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
