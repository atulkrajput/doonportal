import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/automation — create automation rule
export async function POST(req: NextRequest) {
  try {
    const { name, trigger, action, template_id, enabled } = await req.json();
    if (!name || !trigger || !action) {
      return NextResponse.json({ error: 'name, trigger, and action are required' }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        trigger,
        action,
        templateId: template_id ? parseInt(template_id) : null,
        enabled: enabled !== false,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/automation — list rules
export async function GET() {
  try {
    const rules = await prisma.automationRule.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('[API] GET /api/automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
