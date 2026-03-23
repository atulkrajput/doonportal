import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/email-templates — create template
export async function POST(req: NextRequest) {
  try {
    const { name, subject, body } = await req.json();
    if (!name || !subject || !body) {
      return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 });
    }
    const template = await prisma.emailTemplate.create({ data: { name, subject, body } });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/email-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/email-templates — list templates
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[API] GET /api/email-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
