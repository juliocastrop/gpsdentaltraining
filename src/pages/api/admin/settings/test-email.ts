/**
 * Test Email API
 * Send test emails to verify email configuration
 */
import type { APIRoute } from 'astro';
import { getResend } from '../../../../lib/email/client';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email address is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'noreply@gpsdentaltraining.com';

    // Generate test email content based on type
    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'ticket':
        subject = '[TEST] Ticket Confirmation - GPS Dental Training';
        htmlContent = generateTicketTestEmail();
        break;
      case 'seminar_registration':
        subject = '[TEST] Seminar Registration Confirmed - GPS Dental Training';
        htmlContent = generateSeminarRegistrationTestEmail();
        break;
      case 'session_reminder':
        subject = '[TEST] Session Reminder - GPS Dental Training';
        htmlContent = generateSessionReminderTestEmail();
        break;
      case 'certificate':
        subject = '[TEST] Your CE Certificate - GPS Dental Training';
        htmlContent = generateCertificateTestEmail();
        break;
      case 'waitlist':
        subject = '[TEST] Waitlist Notification - GPS Dental Training';
        htmlContent = generateWaitlistTestEmail();
        break;
      default:
        subject = '[TEST] Email from GPS Dental Training';
        htmlContent = generateGenericTestEmail();
    }

    // Send the email
    const { data, error } = await getResend().emails.send({
      from: `GPS Dental Training <${fromEmail}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Test email sent successfully', id: data?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Test email error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to send test email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function generateTicketTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0C2044; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">GPS DENTAL TRAINING</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Ticket Confirmation</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">This is a <strong>TEST EMAIL</strong> for ticket confirmations.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">TICKET CODE</p>
            <p style="margin: 0; color: #0B52AC; font-size: 24px; font-weight: bold; font-family: monospace;">TEST-ABC123</p>
          </div>

          <h3 style="color: #0C2044; margin-top: 20px;">Event Details</h3>
          <p><strong>Event:</strong> Sample Course Title</p>
          <p><strong>Date:</strong> January 25, 2026</p>
          <p><strong>Location:</strong> GPS Dental Training Center</p>
          <p><strong>CE Credits:</strong> 8</p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; padding: 20px; display: inline-block; border-radius: 8px;">
              <p style="margin: 0 0 10px; color: #666;">QR Code would appear here</p>
              <div style="width: 150px; height: 150px; background-color: #ddd; margin: 0 auto;"></div>
            </div>
          </div>

          <p style="color: #666; font-size: 14px;">Show this QR code at check-in.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>GPS Dental Training Center | 6320 Sugarloaf Parkway, Duluth, GA 30097</p>
          <p>(770) 962-2480 | info@gpsdentaltraining.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSeminarRegistrationTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0C2044; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">GPS DENTAL TRAINING</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Seminar Registration Confirmed</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">This is a <strong>TEST EMAIL</strong> for seminar registrations.</p>

          <h3 style="color: #0C2044;">Welcome to GPS Monthly Seminars!</h3>
          <p>You have been registered for the 2026 Monthly Seminar Program.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Program:</strong> Monthly Seminars 2026</p>
            <p><strong>Sessions:</strong> 10 sessions (2 CE credits each)</p>
            <p><strong>Total CE Credits:</strong> 20</p>
            <p><strong>Start Date:</strong> February 15, 2026</p>
          </div>

          <p>Sessions are held monthly. You will receive reminders 24 hours before each session.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>GPS Dental Training Center | 6320 Sugarloaf Parkway, Duluth, GA 30097</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSessionReminderTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #DDC89D; color: #0C2044; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SESSION REMINDER</h1>
          <p style="margin: 10px 0 0;">Your seminar session is tomorrow!</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">This is a <strong>TEST EMAIL</strong> for session reminders.</p>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DDC89D;">
            <strong>Session #5:</strong> Implant Restorations<br>
            <strong>Date:</strong> Tomorrow, January 26, 2026<br>
            <strong>Time:</strong> 9:00 AM - 12:00 PM<br>
            <strong>CE Credits:</strong> 2
          </div>

          <p>Don't forget to bring your QR code for check-in!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>GPS Dental Training Center</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCertificateTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0C2044; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CERTIFICATE READY</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Your CE Certificate is Available</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">This is a <strong>TEST EMAIL</strong> for certificate notifications.</p>

          <p>Congratulations! Your CE Credit Certificate is now available for download.</p>

          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #155724;"><strong>8 CE Credits Earned</strong></p>
            <p style="margin: 5px 0 0; color: #155724;">Advanced Implant Restorations Course</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #0B52AC; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Download Certificate
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>GPS Dental Training Center</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWaitlistTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #28a745; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SPOT AVAILABLE!</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">A ticket is now available</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">This is a <strong>TEST EMAIL</strong> for waitlist notifications.</p>

          <p>Great news! A spot has opened up for the event you were waiting for.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Event:</strong> Advanced Prosthodontics Course</p>
            <p><strong>Date:</strong> March 15, 2026</p>
            <p><strong>Ticket Type:</strong> General Admission</p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ This offer expires in 48 hours</strong></p>
            <p style="margin: 5px 0 0; font-size: 14px;">Register now to secure your spot!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Register Now
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>GPS Dental Training Center</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateGenericTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0C2044; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">GPS DENTAL TRAINING</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Test Email</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">This is a <strong>TEST EMAIL</strong> from GPS Dental Training.</p>

          <p>If you received this email, your email configuration is working correctly!</p>

          <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #155724;"><strong>✓ Email delivery successful</strong></p>
          </div>

          <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>GPS Dental Training Center | 6320 Sugarloaf Parkway, Duluth, GA 30097</p>
          <p>(770) 962-2480 | info@gpsdentaltraining.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
