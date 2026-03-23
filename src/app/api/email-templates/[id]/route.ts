import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/email-templates/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, subject, body } = await req.json();
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (subject) data.subject = subject;
    if (body) data.body = body;

    const template = await prisma.emailTemplate.update({ where: { id: parseInt(id) }, data });
    return NextResponse.json(template);
  } catch (error) {
    console.error('[API] PUT /api/email-templates/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/email-templates/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.emailTemplate.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/email-templates/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
