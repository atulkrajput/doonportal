import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST /api/contact — create lead from contact form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
        productInterest: 'general',
        source: 'website',
        status: 'new',
      },
    });

    const salesEmail = process.env.SALES_EMAIL || 'sales@doonportal.com';
    await sendEmail({
      to: salesEmail,
      subject: `Contact Form: ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    return NextResponse.json({ success: true, lead: { id: lead.id } }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
