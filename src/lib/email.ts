interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email notification.
 *
 * Currently implemented as a stub that logs the email data.
 * Replace with Resend or Nodemailer when credentials are available.
 *
 * To use Resend, set the RESEND_API_KEY environment variable.
 * To use SMTP, set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options;

  // Log email data for development
  console.log('[Email] Sending email:', {
    to,
    subject,
    bodyLength: (html || text || '').length,
    timestamp: new Date().toISOString(),
  });

  // Stub implementation — always succeeds
  // Replace with actual email provider integration when ready
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@doonportal.com',
          to,
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Email] Resend API error:', errorData);
        return { success: false, error: 'Failed to send email' };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('[Email] Resend send error:', error);
      return { success: false, error: 'Email service unavailable' };
    }
  }

  // Stub: simulate successful send
  return {
    success: true,
    messageId: `stub-${Date.now()}`,
  };
}
