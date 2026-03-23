import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST /api/demo — create lead from demo form + optional booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, organization, city, phone, email, message, product_interest, scheduled_date, scheduled_time } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Use explicit product_interest if provided, otherwise infer from message
    let productInterest = product_interest || 'general';
    if (productInterest === 'general') {
      const msg = (message || '').toLowerCase();
      if (msg.includes('school')) productInterest = 'school';
      else if (msg.includes('inventory') || msg.includes('pos') || msg.includes('retail')) productInterest = 'inventory';
      else if (msg.includes('dairy')) productInterest = 'dairy';
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        organization: organization || null,
        city: city || null,
        phone: phone || null,
        email,
        message: message || null,
        productInterest,
        source: 'website',
        status: scheduled_date ? 'demo_scheduled' : 'new',
      },
    });

    // Create demo booking if date provided
    if (scheduled_date) {
      await prisma.demoBooking.create({
        data: {
          leadId: lead.id,
          scheduledDate: scheduled_date,
          scheduledTime: scheduled_time || '10:00',
          notes: message || null,
          status: 'scheduled',
        },
      });
    }

    // Email notification
    const salesEmail = process.env.SALES_EMAIL || 'sales@doonportal.com';
    await sendEmail({
      to: salesEmail,
      subject: `Demo Request: ${name} — ${organization || 'N/A'}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Organization:</strong> ${organization || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>City:</strong> ${city || 'N/A'}</p>
        <p><strong>Product Interest:</strong> ${productInterest}</p>
        <p><strong>Message:</strong> ${message || 'N/A'}</p>
        ${scheduled_date ? `<p><strong>Scheduled:</strong> ${scheduled_date} at ${scheduled_time || '10:00'}</p>` : ''}
      `,
    });

    return NextResponse.json({ success: true, lead: { id: lead.id } }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/demo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/demo — list demo bookings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;

    const bookings = await prisma.demoBooking.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: { lead: { select: { name: true, email: true, phone: true, organization: true } } },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[API] GET /api/demo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
