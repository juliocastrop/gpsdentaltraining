interface WaitlistNotificationData {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  ticketType: string;
  expiresAt: string;
  purchaseUrl: string;
}

export function generateWaitlistNotificationEmail(data: WaitlistNotificationData): string {
  const {
    firstName,
    eventTitle,
    eventDate,
    ticketType,
    expiresAt,
    purchaseUrl,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Spot is Available!</title>
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

          <!-- Urgent Banner -->
          <tr>
            <td style="background-color: #DDC89D; padding: 20px 40px; text-align: center;">
              <h1 style="color: #13326A; margin: 0; font-size: 24px; font-family: 'Montserrat', Arial, sans-serif;">
                A Spot is Available!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello ${firstName || 'there'},
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Great news! A spot has opened up for <strong>${eventTitle}</strong> and you're next on the waitlist!
              </p>

              <!-- Urgency Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0 0 5px;">
                      Act Fast - Limited Time!
                    </p>
                    <p style="color: #B45309; font-size: 14px; margin: 0;">
                      This spot expires on <strong>${expiresAt}</strong>
                    </p>
                  </td>
                </tr>
              </table>

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
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Ticket Type:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${ticketType}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center; margin-bottom: 30px;">
                <tr>
                  <td>
                    <a href="${purchaseUrl}" style="display: inline-block; background-color: #13326A; color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                      Reserve Your Spot Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                If you don't complete your purchase within 48 hours, your spot will be offered to the next person on the waitlist.
              </p>
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

export function generateWaitlistNotificationText(data: WaitlistNotificationData): string {
  const {
    firstName,
    eventTitle,
    eventDate,
    ticketType,
    expiresAt,
    purchaseUrl,
  } = data;

  return `
A SPOT IS AVAILABLE!

Hello ${firstName || 'there'},

Great news! A spot has opened up for ${eventTitle} and you're next on the waitlist!

⚠️  ACT FAST - This spot expires on ${expiresAt}

EVENT DETAILS
─────────────
Event: ${eventTitle}
Date: ${eventDate}
Ticket Type: ${ticketType}

Reserve your spot now: ${purchaseUrl}

If you don't complete your purchase within 48 hours, your spot will be offered to the next person on the waitlist.

Questions? Contact us at info@gpsdentaltraining.com

GPS Dental Training
3700 Crestwood Pkwy NW, Suite 640
Duluth, GA 30096
  `.trim();
}
