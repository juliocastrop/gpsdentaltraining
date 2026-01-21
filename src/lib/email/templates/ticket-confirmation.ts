interface TicketEmailData {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketCode: string;
  ticketType: string;
  qrCodeUrl: string;
  orderNumber: string;
}

export function generateTicketConfirmationEmail(data: TicketEmailData): string {
  const {
    attendeeName,
    eventTitle,
    eventDate,
    eventVenue,
    ticketCode,
    ticketType,
    qrCodeUrl,
    orderNumber,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket is Ready!</title>
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

          <!-- Success Banner -->
          <tr>
            <td style="background-color: #28A745; padding: 20px 40px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-family: 'Montserrat', Arial, sans-serif;">
                Your Ticket is Ready!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello <strong>${attendeeName}</strong>,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Thank you for your purchase! Your ticket for <strong>${eventTitle}</strong> is confirmed.
              </p>

              <!-- Event Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #13326A; margin: 0 0 20px; font-size: 18px; font-family: 'Montserrat', Arial, sans-serif;">
                      Event Details
                    </h2>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Event:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${eventTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${eventDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Venue:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${eventVenue}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Ticket Type:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${ticketType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Order #:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${orderNumber}</td>
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
                    <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #E0E0E0; border-radius: 8px;">
                    <p style="color: #666666; font-size: 12px; margin: 15px 0 0;">
                      Ticket Code: <strong>${ticketCode}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFF8E7; border-left: 4px solid #DDC89D; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #13326A; margin: 0 0 10px; font-size: 14px; font-family: 'Montserrat', Arial, sans-serif;">
                      Check-in Instructions
                    </h3>
                    <ul style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Present this QR code at the registration desk</li>
                      <li>Arrive 15-30 minutes before the event starts</li>
                      <li>Bring a valid ID for verification</li>
                      <li>Save this email or screenshot the QR code</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center;">
                <tr>
                  <td>
                    <a href="https://gpsdentaltraining.com/account/tickets" style="display: inline-block; background-color: #0D6EFD; color: #FFFFFF; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View My Tickets
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
}

export function generateTicketConfirmationText(data: TicketEmailData): string {
  const {
    attendeeName,
    eventTitle,
    eventDate,
    eventVenue,
    ticketCode,
    ticketType,
    orderNumber,
  } = data;

  return `
YOUR TICKET IS READY!

Hello ${attendeeName},

Thank you for your purchase! Your ticket for ${eventTitle} is confirmed.

EVENT DETAILS
─────────────
Event: ${eventTitle}
Date: ${eventDate}
Venue: ${eventVenue}
Ticket Type: ${ticketType}
Order #: ${orderNumber}
Ticket Code: ${ticketCode}

CHECK-IN INSTRUCTIONS
─────────────────────
• Present your ticket code at the registration desk
• Arrive 15-30 minutes before the event starts
• Bring a valid ID for verification

View your tickets online: https://gpsdentaltraining.com/account/tickets

Questions? Contact us at info@gpsdentaltraining.com

GPS Dental Training
3700 Crestwood Pkwy NW, Suite 640
Duluth, GA 30096
  `.trim();
}
