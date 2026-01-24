import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a unique QR code string for seminar registration
 */
export function generateSeminarQRCodeString(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `SEM-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Generate QR code data URL for seminar registration
 */
export async function generateSeminarQRCode(qrCodeString: string): Promise<string> {
  const qrCodeUrl = await QRCode.toDataURL(qrCodeString, {
    width: 300,
    margin: 2,
    color: {
      dark: '#0C2044', // GPS Navy
      light: '#FFFFFF',
    },
  });

  return qrCodeUrl;
}

/**
 * Generate both QR code string and data URL
 */
export async function generateSeminarQRCodeWithString(): Promise<{ qrCode: string; qrCodeUrl: string }> {
  const qrCode = generateSeminarQRCodeString();
  const qrCodeUrl = await generateSeminarQRCode(qrCode);

  return { qrCode, qrCodeUrl };
}
