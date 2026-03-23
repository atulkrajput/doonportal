import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/automation/:id — update rule
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, trigger, action, template_id, enabled } = await req.json();
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (trigger) data.trigger = trigger;
    if (action) data.action = action;
    if (template_id !== undefined) data.templateId = template_id ? parseInt(template_id) : null;
    if (enabled !== undefined) data.enabled = enabled;

    const rule = await prisma.automationRule.update({ where: { id: parseInt(id) }, data });
    return NextResponse.json(rule);
  } catch (error) {
    console.error('[API] PUT /api/automation/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/automation/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.automationRule.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/automation/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
