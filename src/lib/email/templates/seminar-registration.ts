/**
 * Seminar Registration Confirmation Email Template
 * Sent when a user registers for GPS Monthly Seminars
 */

interface SeminarRegistrationData {
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

export function generateSeminarRegistrationEmail(data: SeminarRegistrationData): string {
  const {
    attendeeName,
    seminarTitle,
    seminarYear,
    totalSessions,
    creditsPerSession,
    totalCredits,
    qrCodeUrl,
    qrCode,
    orderNumber,
    firstSessionDate,
    price,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GPS Monthly Seminars!</title>
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
                🎉 Welcome to GPS Monthly Seminars!
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
                Congratulations on joining the <strong>${seminarTitle}</strong> program! You're now enrolled in our comprehensive continuing education series.
              </p>

              <!-- Program Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #13326A; margin: 0 0 20px; font-size: 18px; font-family: 'Montserrat', Arial, sans-serif;">
                      Your Membership Details
                    </h2>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 140px;">Program:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${seminarTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Year:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${seminarYear}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Total Sessions:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${totalSessions} sessions</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">CE Credits:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${creditsPerSession} per session (${totalCredits} total)</td>
                      </tr>
                      ${firstSessionDate ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">First Session:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${firstSessionDate}</td>
                      </tr>
                      ` : ''}
                      ${orderNumber ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">Order #:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;">${orderNumber}</td>
                      </tr>
                      ` : ''}
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
                    <p style="color: #666666; font-size: 14px; margin: 0 0 15px;">
                      Use this code for all ${totalSessions} sessions
                    </p>
                    <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #E0E0E0; border-radius: 8px;">
                    <p style="color: #666666; font-size: 12px; margin: 15px 0 0;">
                      Registration Code: <strong>${qrCode}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What's Included -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F0F7FF; border-left: 4px solid #13326A; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #13326A; margin: 0 0 10px; font-size: 14px; font-family: 'Montserrat', Arial, sans-serif;">
                      What's Included in Your Membership
                    </h3>
                    <ul style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>${totalSessions} monthly seminars with expert speakers</li>
                      <li>${totalCredits} total CE credits (${creditsPerSession} per session)</li>
                      <li>1 makeup session per year if you miss a session</li>
                      <li>Bi-annual certificates (June 30 & December 31)</li>
                      <li>Networking with dental professionals</li>
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

          <!-- PACE Notice -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F0F7FF; border-radius: 8px;">
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
  `.trim();
}

export function generateSeminarRegistrationText(data: SeminarRegistrationData): string {
  const {
    attendeeName,
    seminarTitle,
    seminarYear,
    totalSessions,
    creditsPerSession,
    totalCredits,
    qrCode,
    orderNumber,
    firstSessionDate,
  } = data;

  return `
WELCOME TO GPS MONTHLY SEMINARS!

Hello ${attendeeName},

Congratulations on joining the ${seminarTitle} program! You're now enrolled in our comprehensive continuing education series.

YOUR MEMBERSHIP DETAILS
───────────────────────
Program: ${seminarTitle}
Year: ${seminarYear}
Total Sessions: ${totalSessions} sessions
CE Credits: ${creditsPerSession} per session (${totalCredits} total)
${firstSessionDate ? `First Session: ${firstSessionDate}` : ''}
${orderNumber ? `Order #: ${orderNumber}` : ''}
Registration Code: ${qrCode}

WHAT'S INCLUDED
───────────────
• ${totalSessions} monthly seminars with expert speakers
• ${totalCredits} total CE credits (${creditsPerSession} per session)
• 1 makeup session per year if you miss a session
• Bi-annual certificates (June 30 & December 31)
• Networking with dental professionals

View your seminars: https://gpsdentaltraining.com/account/seminars

Questions? Contact us at info@gpsdentaltraining.com

GPS Dental Training
3700 Crestwood Pkwy NW, Suite 640
Duluth, GA 30096
  `.trim();
}
