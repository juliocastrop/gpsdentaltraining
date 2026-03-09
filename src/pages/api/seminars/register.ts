import type { APIRoute } from 'astro';
import { getUser } from '../../../lib/supabase/auth';
import {
  createSeminarRegistration,
  getUserSeminarRegistration,
  getUserByAuthId,
  getUpcomingSeminarSessions,
} from '../../../lib/supabase/queries';
import QRCode from 'qrcode';
import crypto from 'crypto';

function generateQRCodeString(userId: string, seminarId: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `SEM-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * POST /api/seminars/register
 * Register a user for a monthly seminar
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const authUser = await getUser(cookies);
    if (!authUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User authentication is required',
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { seminarId, orderId } = body;

    if (!seminarId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await getUserByAuthId(authUser.id);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has an active registration
    const existingRegistration = await getUserSeminarRegistration(user.id, seminarId);
    if (existingRegistration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You are already registered for this seminar',
        data: {
          registrationId: existingRegistration.id,
          status: existingRegistration.status,
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const upcomingSessions = await getUpcomingSeminarSessions(seminarId, 1);
    const startSessionDate = upcomingSessions.length > 0
      ? upcomingSessions[0].session_date
      : null;

    const qrCodeString = generateQRCodeString(user.id, seminarId);
    const qrCodeUrl = await QRCode.toDataURL(qrCodeString, {
      width: 300,
      margin: 2,
      color: { dark: '#0C2044', light: '#FFFFFF' },
    });

    const registration = await createSeminarRegistration({
      user_id: user.id,
      seminar_id: seminarId,
      order_id: orderId || undefined,
      start_session_date: startSessionDate || undefined,
      qr_code: qrCodeString,
      qr_code_url: qrCodeUrl,
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully registered for seminar',
      data: {
        id: registration.id,
        qr_code: registration.qr_code,
        qr_code_url: registration.qr_code_url,
        sessions_remaining: registration.sessions_remaining,
        seminar: registration.seminar,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error registering for seminar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register for seminar',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
