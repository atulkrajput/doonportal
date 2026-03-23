import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { runAutomation } from '@/lib/automation';

// POST /api/leads — create new lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, organization, city, phone, email, message, product_interest, source } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        organization: organization || null,
        city: city || null,
        phone: phone || null,
        email,
        message: message || null,
        productInterest: product_interest || 'general',
        source: source || 'website',
        status: 'new',
      },
    });

    // Email notification to admin
    const salesEmail = process.env.SALES_EMAIL || 'sales@doonportal.com';
    await sendEmail({
      to: salesEmail,
      subject: `New Lead: ${name} — ${product_interest || 'General'}`,
      html: `
        <h2>New Lead Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Organization:</strong> ${organization || 'N/A'}</p>
        <p><strong>City:</strong> ${city || 'N/A'}</p>
        <p><strong>Product Interest:</strong> ${product_interest || 'General'}</p>
        <p><strong>Message:</strong> ${message || 'N/A'}</p>
        <p><strong>Source:</strong> ${source || 'website'}</p>
      `,
    });

    // Run automation rules for new lead
    runAutomation('new_lead', lead.id).catch(err => console.error('[Automation] Error:', err));

    return NextResponse.json({ success: true, lead: { id: lead.id } }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/leads list leads with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const tag = searchParams.get('tag');
    const source = searchParams.get('source');
    const sort = searchParams.get('sort') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (city) where.city = { contains: city };
    if (state) where.state = { contains: state };
    if (source && source !== 'all') where.source = source;
    if (tag) where.tags = { some: { tagName: tag } };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { organization: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { demoBookings: true, activities: true } },
          tags: true,
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, limit });
  } catch (error) {
    console.error('[API] GET /api/leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
