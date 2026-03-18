import { NextResponse } from 'next/server';
import { demoFormSchema } from '@/lib/validation';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = demoFormSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Validation failed', details: fieldErrors },
        { status: 400 }
      );
    }

    const { name, organization, email, phone, city, message } = result.data;

    // Send email notification to sales team
    const emailResult = await sendEmail({
      to: process.env.SALES_EMAIL || 'sales@doonportal.com',
      subject: `New Demo Request from ${name} — ${organization}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>City:</strong> ${city || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message || 'No message'}</p>
        <hr />
        <p><em>Submitted at ${new Date().toISOString()}</em></p>
      `,
    });

    if (!emailResult.success) {
      console.error('[API /api/demo] Email send failed:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to process request. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Demo request submitted successfully', id: emailResult.messageId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/demo] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
