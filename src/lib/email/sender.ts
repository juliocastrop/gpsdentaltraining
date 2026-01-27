import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, ADMIN_EMAILS } from './client';
import {
  generateTicketConfirmationEmail,
  generateTicketConfirmationText,
} from './templates/ticket-confirmation';
import {
  generateWaitlistNotificationEmail,
  generateWaitlistNotificationText,
} from './templates/waitlist-notification';
import {
  generateSeminarRegistrationEmail,
  generateSeminarRegistrationText,
} from './templates/seminar-registration';

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

    const { data: result, error } = await getResend().emails.send({
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

    const { data: result, error } = await getResend().emails.send({
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

    const { data: result, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `You're on the waitlist for ${data.eventTitle}`,
      html,
    });

    if (error) {
      console.error('Resend API error (waitlist confirmation):', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('Exception sending waitlist confirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send certificate email
 */
export async function sendCertificateEmail(
  to: string,
  data: {
    attendeeName: string;
    eventTitle: string;
    eventDate: string;
    ceCredits: number;
    certificateCode: string;
    verificationUrl: string;
    pdfUrl?: string;
  }
): Promise<SendEmailResult> {
  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Open Sans', Arial, sans-serif; background-color: #F2F2F2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F2F2F2;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #13326A; padding: 30px 40px; text-align: center;">
              <img src="https://gpsdentaltraining.com/wp-content/uploads/2023/01/gps-logo-white.png" alt="GPS Dental Training" style="height: 50px; width: auto;">
            </td>
          </tr>

          <!-- Gold Banner -->
          <tr>
            <td style="background-color: #DDC89D; padding: 20px 40px; text-align: center;">
              <h1 style="color: #13326A; margin: 0; font-size: 24px; font-family: 'Montserrat', Arial, sans-serif;">
                🎓 Your Certificate is Ready!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello ${data.attendeeName},
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Congratulations on completing <strong>${data.eventTitle}</strong>! Your certificate of completion is now available.
              </p>

              <!-- Certificate Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #13326A; margin: 0 0 20px; font-size: 18px; font-family: 'Montserrat', Arial, sans-serif;">
                      Certificate Details
                    </h2>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 120px;">Event:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.eventTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.eventDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">CE Credits:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.ceCredits} CE</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Certificate Code:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-family: monospace; font-weight: 600;">${data.certificateCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center; margin-bottom: 30px;">
                <tr>
                  <td>
                    <a href="${data.verificationUrl}" style="display: inline-block; background-color: #13326A; color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                      View Certificate
                    </a>
                  </td>
                </tr>
              </table>

              ${data.pdfUrl ? `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                You can also <a href="${data.pdfUrl}" style="color: #0B52AC;">download the PDF version</a>.
              </p>
              ` : ''}

              <!-- PACE Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; background-color: #F0F7FF; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #13326A; font-size: 14px; font-weight: 600; margin: 0 0 5px;">
                      PACE Approved Provider
                    </p>
                    <p style="color: #666666; font-size: 13px; margin: 0;">
                      GPS Dental Training is a nationally approved PACE program provider for FAGD/MAGD credit.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #13326A; padding: 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 10px;">
                      Questions? Contact us at <a href="mailto:info@gpsdentaltraining.com" style="color: #DDC89D;">info@gpsdentaltraining.com</a>
                    </p>
                    <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                      GPS Dental Training | 3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096
                    </p>
                    <p style="color: #9CA3AF; font-size: 11px; margin: 15px 0 0;">
                      &copy; ${new Date().getFullYear()} GPS Dental Training. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data: result, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `Your Certificate for ${data.eventTitle} is Ready!`,
      html,
    });

    if (error) {
      console.error('Error sending certificate email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('Error sending certificate email:', error);
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
    const { data: result, error } = await getResend().emails.send({
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

/**
 * Send seminar registration confirmation email
 */
export async function sendSeminarRegistrationEmail(
  to: string,
  data: {
    attendeeName: string;
    seminarTitle: string;
    seminarYear: number;
    totalSessions: number;
    creditsPerSession: number;
    totalCredits: number;
    qrCodeUrl: string;
    qrCode: string;
    orderNumber?: string;
    firstSessionDate?: string;
    price: number;
  }
): Promise<SendEmailResult> {
  try {
    const html = generateSeminarRegistrationEmail(data);
    const text = generateSeminarRegistrationText(data);

    const { data: result, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `Welcome to ${data.seminarTitle} ${data.seminarYear}!`,
      html,
      text,
    });

    if (error) {
      console.error('Error sending seminar registration email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('Error sending seminar registration email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send seminar session reminder email
 */
export async function sendSessionReminderEmail(
  to: string,
  data: {
    attendeeName: string;
    seminarTitle: string;
    sessionNumber: number;
    sessionDate: string;
    sessionTime: string;
    sessionTopic?: string;
    venue: string;
    address: string;
    qrCodeUrl: string;
    qrCode: string;
  }
): Promise<SendEmailResult> {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: GPS Monthly Seminar Tomorrow</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Open Sans', Arial, sans-serif; background-color: #F2F2F2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F2F2F2;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #13326A; padding: 30px 40px; text-align: center;">
              <img src="https://gpsdentaltraining.com/wp-content/uploads/2023/01/gps-logo-white.png" alt="GPS Dental Training" style="height: 50px; width: auto;">
            </td>
          </tr>

          <!-- Gold Banner -->
          <tr>
            <td style="background-color: #DDC89D; padding: 20px 40px; text-align: center;">
              <h1 style="color: #13326A; margin: 0; font-size: 24px; font-family: 'Montserrat', Arial, sans-serif;">
                ⏰ Reminder: Session Tomorrow!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello <strong>${data.attendeeName}</strong>,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                This is a friendly reminder that your <strong>${data.seminarTitle}</strong> session is <strong>tomorrow</strong>!
              </p>

              <!-- Session Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #13326A; margin: 0 0 20px; font-size: 18px; font-family: 'Montserrat', Arial, sans-serif;">
                      Session ${data.sessionNumber} Details
                    </h2>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Date:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.sessionDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Time:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.sessionTime}</td>
                      </tr>
                      ${data.sessionTopic ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Topic:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.sessionTopic}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Venue:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${data.venue}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Address:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px;">${data.address}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="color: #333333; font-size: 16px; margin: 0 0 15px; font-weight: 600;">
                      Your Check-in QR Code
                    </p>
                    <img src="${data.qrCodeUrl}" alt="QR Code" style="width: 180px; height: 180px; border: 1px solid #E0E0E0; border-radius: 8px;">
                    <p style="color: #666666; font-size: 12px; margin: 15px 0 0;">
                      Code: <strong>${data.qrCode}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reminder Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFF3CD; border-left: 4px solid #FFC107; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #856404; margin: 0 0 10px; font-size: 14px;">
                      Don't Forget!
                    </h3>
                    <ul style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Arrive 10-15 minutes early for check-in</li>
                      <li>Bring your phone to scan your QR code</li>
                      <li>2 CE credits will be awarded upon check-in</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center;">
                <tr>
                  <td>
                    <a href="https://gpsdentaltraining.com/account/seminars" style="display: inline-block; background-color: #13326A; color: #FFFFFF; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View My Seminars
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #13326A; padding: 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 10px;">
                      Questions? Contact us at <a href="mailto:info@gpsdentaltraining.com" style="color: #DDC89D;">info@gpsdentaltraining.com</a>
                    </p>
                    <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                      GPS Dental Training | 3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096
                    </p>
                    <p style="color: #9CA3AF; font-size: 11px; margin: 15px 0 0;">
                      &copy; ${new Date().getFullYear()} GPS Dental Training. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
REMINDER: GPS MONTHLY SEMINAR TOMORROW

Hello ${data.attendeeName},

This is a friendly reminder that your ${data.seminarTitle} session is tomorrow!

SESSION ${data.sessionNumber} DETAILS
─────────────────────────
Date: ${data.sessionDate}
Time: ${data.sessionTime}
${data.sessionTopic ? `Topic: ${data.sessionTopic}` : ''}
Venue: ${data.venue}
Address: ${data.address}

Your Check-in Code: ${data.qrCode}

DON'T FORGET:
• Arrive 10-15 minutes early for check-in
• Bring your phone to scan your QR code
• 2 CE credits will be awarded upon check-in

View your seminars: https://gpsdentaltraining.com/account/seminars

Questions? Contact us at info@gpsdentaltraining.com

GPS Dental Training
3700 Crestwood Pkwy NW, Suite 640
Duluth, GA 30096
    `.trim();

    const { data: result, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: EMAIL_REPLY_TO,
      subject: `Reminder: ${data.seminarTitle} Session ${data.sessionNumber} Tomorrow`,
      html,
      text,
    });

    if (error) {
      console.error('Error sending session reminder email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('Error sending session reminder email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
