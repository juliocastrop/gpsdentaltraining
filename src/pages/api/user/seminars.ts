import type { APIRoute } from 'astro';
import {
  getUserByClerkId,
  getUserSeminarRegistrations,
  getUserSeminarCertificates,
  getSeminarSessions,
} from '../../../lib/supabase/queries';

/**
 * GET /api/user/seminars
 * Get current user's seminar registrations and progress
 *
 * Headers:
 *   Authorization: Bearer <clerk_user_id> or passed via query param
 *
 * Query params:
 *   clerkUserId: string - Clerk user ID (alternative to header)
 *   includeCertificates?: boolean - Include seminar certificates
 *   includeSessions?: boolean - Include all sessions for registered seminars
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Get user ID from header or query param
    const authHeader = request.headers.get('Authorization');
    const clerkUserId = authHeader?.replace('Bearer ', '') || url.searchParams.get('clerkUserId');

    if (!clerkUserId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required',
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from Clerk ID
    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const includeCertificates = url.searchParams.get('includeCertificates') === 'true';
    const includeSessions = url.searchParams.get('includeSessions') === 'true';

    // Get registrations
    const registrations = await getUserSeminarRegistrations(user.id);

    // Format response
    const formattedRegistrations = await Promise.all(
      (registrations || []).map(async (reg) => {
        const result: any = {
          id: reg.id,
          status: reg.status,
          registration_date: reg.registration_date,
          start_session_date: reg.start_session_date,
          sessions_completed: reg.sessions_completed,
          sessions_remaining: reg.sessions_remaining,
          makeup_used: reg.makeup_used,
          qr_code: reg.qr_code,
          qr_code_url: reg.qr_code_url,
          seminar: reg.seminar ? {
            id: reg.seminar.id,
            title: reg.seminar.title,
            year: reg.seminar.year,
            total_sessions: reg.seminar.total_sessions,
            credits_per_session: reg.seminar.credits_per_session,
            total_credits: reg.seminar.total_credits,
          } : null,
          attendance: reg.attendance?.map(att => ({
            id: att.id,
            session_number: att.session?.session_number,
            session_date: att.session?.session_date,
            topic: att.session?.topic,
            checked_in_at: att.checked_in_at,
            is_makeup: att.is_makeup,
            credits_awarded: att.credits_awarded,
          })) || [],
          total_credits_earned: reg.attendance?.reduce(
            (sum, att) => sum + (att.credits_awarded || 0),
            0
          ) || 0,
        };

        // Include all sessions if requested
        if (includeSessions && reg.seminar_id) {
          const sessions = await getSeminarSessions(reg.seminar_id);
          const attendedSessionIds = new Set(
            reg.attendance?.map(att => att.session_id) || []
          );

          result.all_sessions = sessions.map(session => ({
            id: session.id,
            session_number: session.session_number,
            session_date: session.session_date,
            topic: session.topic,
            attended: attendedSessionIds.has(session.id),
          }));
        }

        return result;
      })
    );

    // Separate active and completed
    const activeRegistrations = formattedRegistrations.filter(r => r.status === 'active');
    const completedRegistrations = formattedRegistrations.filter(r => r.status === 'completed');

    // Get certificates if requested
    let certificates = null;
    if (includeCertificates) {
      const userCerts = await getUserSeminarCertificates(user.id);
      certificates = userCerts?.map(cert => ({
        id: cert.id,
        certificate_code: cert.certificate_code,
        generated_at: cert.generated_at,
        sent_at: cert.sent_at,
        pdf_url: cert.pdf_url,
        verification_url: `https://gpsdentaltraining.com/certificate/${cert.certificate_code}`,
      })) || [];
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
        },
        active_registrations: activeRegistrations,
        completed_registrations: completedRegistrations,
        total_registrations: formattedRegistrations.length,
        ...(includeCertificates && { certificates }),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user seminars:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch seminar data',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
