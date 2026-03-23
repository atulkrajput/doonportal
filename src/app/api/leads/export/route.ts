import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/leads/export — export leads as CSV
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const tag = searchParams.get('tag');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (city) where.city = { contains: city };
    if (tag) where.tags = { some: { tagName: tag } };

    const leads = await prisma.lead.findMany({
      where,
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'id,name,email,phone,organization,city,state,product_interest,source,status,score,tags,created_at\n';
    const rows = leads.map(l =>
      `${l.id},"${l.name}","${l.email}","${l.phone || ''}","${l.organization || ''}","${l.city || ''}","${l.state || ''}","${l.productInterest}","${l.source}","${l.status}",${l.score},"${l.tags.map(t => t.tagName).join(';')}","${l.createdAt.toISOString()}"`
    ).join('\n');

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/leads/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
