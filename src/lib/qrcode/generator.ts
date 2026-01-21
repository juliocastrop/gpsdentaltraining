import QRCode from 'qrcode';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabase/client';
import { updateTicketQRCode } from '../supabase/queries';

const QR_SECRET = import.meta.env.QR_CODE_SECRET || 'gps-dental-qr-secret-key';

interface QRCodeData {
  ticket_code: string;
  event_id: string;
  hash: string;
}

/**
 * Generate a secure hash for QR code verification
 */
function generateSecureHash(ticketCode: string, eventId: string): string {
  const data = `${ticketCode}:${eventId}:${QR_SECRET}`;
  return crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex').substring(0, 16);
}

/**
 * Verify a QR code hash
 */
export function verifyQRCodeHash(ticketCode: string, eventId: string, hash: string): boolean {
  const expectedHash = generateSecureHash(ticketCode, eventId);
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedHash)
  );
}

/**
 * Generate QR code data object
 */
export function createQRCodeData(ticketCode: string, eventId: string): QRCodeData {
  return {
    ticket_code: ticketCode,
    event_id: eventId,
    hash: generateSecureHash(ticketCode, eventId),
  };
}

/**
 * Generate QR code as base64 data URL
 */
export async function generateQRCodeDataURL(data: QRCodeData): Promise<string> {
  const jsonData = JSON.stringify(data);

  const options: QRCode.QRCodeToDataURLOptions = {
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#13326A', // GPS Navy
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  };

  return QRCode.toDataURL(jsonData, options);
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(data: QRCodeData): Promise<string> {
  const jsonData = JSON.stringify(data);

  const options: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    width: 300,
    margin: 2,
    color: {
      dark: '#13326A',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  };

  return QRCode.toString(jsonData, options);
}

/**
 * Generate QR code and upload to Supabase Storage
 */
export async function generateAndStoreQRCode(
  ticketId: string,
  ticketCode: string,
  eventId: string
): Promise<{ qrCodeData: QRCodeData; qrCodeUrl: string }> {
  // Generate QR code data
  const qrCodeData = createQRCodeData(ticketCode, eventId);

  // Generate QR code as PNG buffer
  const jsonData = JSON.stringify(qrCodeData);
  const qrBuffer = await QRCode.toBuffer(jsonData, {
    type: 'png',
    width: 300,
    margin: 2,
    color: {
      dark: '#13326A',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  // Upload to Supabase Storage
  const fileName = `${ticketCode}.png`;
  const filePath = `tickets/${eventId}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('qrcodes')
    .upload(filePath, qrBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading QR code:', uploadError);
    throw new Error('Failed to upload QR code');
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('qrcodes')
    .getPublicUrl(filePath);

  const qrCodeUrl = urlData.publicUrl;

  // Update ticket with QR code data
  await updateTicketQRCode(ticketId, qrCodeData, qrCodeUrl);

  return { qrCodeData, qrCodeUrl };
}

/**
 * Parse QR code data from scanned string
 */
export function parseQRCodeData(scannedData: string): QRCodeData | null {
  try {
    const data = JSON.parse(scannedData);

    if (data.ticket_code && data.event_id && data.hash) {
      return data as QRCodeData;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate scanned QR code
 */
export function validateScannedQRCode(scannedData: string): {
  valid: boolean;
  data: QRCodeData | null;
  error?: string;
} {
  const data = parseQRCodeData(scannedData);

  if (!data) {
    return {
      valid: false,
      data: null,
      error: 'Invalid QR code format',
    };
  }

  const isValidHash = verifyQRCodeHash(data.ticket_code, data.event_id, data.hash);

  if (!isValidHash) {
    return {
      valid: false,
      data,
      error: 'QR code verification failed',
    };
  }

  return {
    valid: true,
    data,
  };
}
