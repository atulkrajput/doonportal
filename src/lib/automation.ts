import prisma from './prisma';
import { sendEmail } from './email';

/**
 * Run automation rules for a given trigger.
 * Called from API routes when events occur (e.g., new lead created).
 */
export async function runAutomation(trigger: string, leadId: number) {
  const rules = await prisma.automationRule.findMany({
    where: { trigger, enabled: true },
  });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  for (const rule of rules) {
    try {
      switch (rule.action) {
        case 'send_email': {
          let subject = `Follow-up: ${lead.name}`;
          let body = `<p>Hi ${lead.name},</p><p>Thank you for your interest in DoonPortal.</p>`;

          if (rule.templateId) {
            const template = await prisma.emailTemplate.findUnique({ where: { id: rule.templateId } });
            if (template) {
              subject = template.subject.replace(/\{\{name\}\}/g, lead.name);
              body = template.body.replace(/\{\{name\}\}/g, lead.name).replace(/\{\{organization\}\}/g, lead.organization || '');
            }
          }

          await sendEmail({ to: lead.email, subject, html: body });
          await prisma.activity.create({
            data: { leadId: lead.id, type: 'email', notes: `[Auto] ${rule.name}: ${subject}` },
          });
          break;
        }

        case 'mark_followup': {
          const followupDate = new Date();
          followupDate.setDate(followupDate.getDate() + 1);
          await prisma.lead.update({
            where: { id: lead.id },
            data: { nextFollowupDate: followupDate, followupStatus: 'pending' },
          });
          await prisma.activity.create({
            data: { leadId: lead.id, type: 'meeting', notes: `[Auto] ${rule.name}: Follow-up scheduled` },
          });
          break;
        }

        case 'send_whatsapp': {
          const message = `Hi ${lead.name}, thank you for your interest in DoonPortal. We'd love to schedule a demo for you.`;
          await prisma.whatsappLog.create({
            data: { leadId: lead.id, message, status: 'sent' },
          });
          await prisma.activity.create({
            data: { leadId: lead.id, type: 'whatsapp', notes: `[Auto] ${rule.name}: WhatsApp sent` },
          });
          break;
        }
      }
    } catch (error) {
      console.error(`[Automation] Rule "${rule.name}" failed for lead ${leadId}:`, error);
    }
  }
}
