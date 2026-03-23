import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/leads/:id/tags — add tag to lead
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tag_name } = await req.json();
    if (!tag_name) return NextResponse.json({ error: 'tag_name is required' }, { status: 400 });

    const tag = await prisma.leadTag.create({
      data: { leadId: parseInt(id), tagName: tag_name },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Tag already exists on this lead' }, { status: 409 });
    }
    console.error('[API] POST /api/leads/:id/tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/leads/:id/tags — remove tag from lead
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tag_name } = await req.json();
    if (!tag_name) return NextResponse.json({ error: 'tag_name is required' }, { status: 400 });

    await prisma.leadTag.deleteMany({
      where: { leadId: parseInt(id), tagName: tag_name },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/leads/:id/tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
