import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST /api/outreach/email — send email to leads
export async function POST(req: NextRequest) {
  try {
    const { lead_ids, template_id, subject, body } = await req.json();

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 });
    }

    let emailSubject = subject;
    let emailBody = body;

    // Use template if provided
    if (template_id) {
      const template = await prisma.emailTemplate.findUnique({ where: { id: parseInt(template_id) } });
      if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      emailSubject = template.subject;
      emailBody = template.body;
    }

    if (!emailSubject || !emailBody) {
      return NextResponse.json({ error: 'subject and body are required (or provide template_id)' }, { status: 400 });
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: lead_ids.map((id: number) => parseInt(String(id))) } },
    });

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      // Replace placeholders in template
      const personalizedSubject = emailSubject.replace(/\{\{name\}\}/g, lead.name).replace(/\{\{organization\}\}/g, lead.organization || '');
      const personalizedBody = emailBody.replace(/\{\{name\}\}/g, lead.name).replace(/\{\{organization\}\}/g, lead.organization || '');

      const result = await sendEmail({
        to: lead.email,
        subject: personalizedSubject,
        html: personalizedBody,
      });

      if (result.success) {
        sent++;
        // Log activity
        await prisma.activity.create({
          data: { leadId: lead.id, type: 'email', notes: `Email sent: ${personalizedSubject}` },
        });
        // Score boost for email sent
        await prisma.lead.update({ where: { id: lead.id }, data: { score: { increment: 2 } } });
      } else {
        failed++;
      }
    }

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error('[API] POST /api/outreach/email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
