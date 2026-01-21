import { resend, EMAIL_FROM, EMAIL_REPLY_TO, ADMIN_EMAILS } from './client';
import {
  generateTicketConfirmationEmail,
  generateTicketConfirmationText,
} from './templates/ticket-confirmation';
import {
  generateWaitlistNotificationEmail,
  generateWaitlistNotificationText,
} from './templates/waitlist-notification';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send ticket confirmation email
 */
export async function sendTicketConfirmationEmail(
  to: string,
  data: {
    attendeeName: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    ticketCode: string;
    ticketType: string;
    qrCodeUrl: string;
    orderNumber: string;
  }
): Promise<SendEmailResult> {
  try {
    const html = generateTicketConfirmationEmail(data);
    const text = generateTicketConfirmationText(data);

    const { data: result, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `Your Ticket for ${data.eventTitle} is Ready!`,
      html,
      text,
    });

    if (error) {
      console.error('Error sending ticket email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('Error sending ticket email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send waitlist notification email
 */
export async function sendWaitlistNotificationEmail(
  to: string,
  data: {
    firstName: string;
    eventTitle: string;
    eventDate: string;
    ticketType: string;
    expiresAt: string;
    purchaseUrl: string;
  }
): Promise<SendEmailResult> {
  try {
    const html = generateWaitlistNotificationEmail(data);
    const text = generateWaitlistNotificationText(data);

    const { data: result, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `A spot opened up for ${data.eventTitle}!`,
      html,
      text,
    });

    if (error) {
      console.error('Error sending waitlist notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('Error sending waitlist notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send waitlist confirmation email
 */
export async function sendWaitlistConfirmationEmail(
  to: string,
  data: {
    firstName?: string;
    eventTitle: string;
    position: number;
  }
): Promise<SendEmailResult> {
  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; background-color: #F2F2F2; padding: 20px;">
  <table role="presentation" width="600" style="margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #13326A; padding: 30px; text-align: center;">
        <img src="https://gpsdentaltraining.com/wp-content/uploads/2023/01/gps-logo-white.png" height="50" alt="GPS Dental Training">
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #13326A; margin: 0 0 20px;">You're on the Waitlist!</h1>
        <p>Hello ${data.firstName || 'there'},</p>
        <p>You've been added to the waitlist for <strong>${data.eventTitle}</strong>.</p>
        <p>Your position: <strong>#${data.position}</strong></p>
        <p>We'll notify you immediately if a spot becomes available. You'll have 48 hours to complete your purchase.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questions? Contact us at <a href="mailto:info@gpsdentaltraining.com">info@gpsdentaltraining.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data: result, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `You're on the waitlist for ${data.eventTitle}`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin notification email
 */
export async function sendAdminNotification(
  subject: string,
  content: string
): Promise<SendEmailResult> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAILS,
      replyTo: EMAIL_REPLY_TO,
      subject: `[GPS Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #13326A;">${subject}</h2>
          <div>${content}</div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from GPS Dental Training.
          </p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
