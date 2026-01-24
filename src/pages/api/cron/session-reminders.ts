import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/client';
import { sendSessionReminderEmail } from '../../../lib/email/sender';

/**
 * GET /api/cron/session-reminders
 * Send reminder emails to seminar attendees 24 hours before their session
 * Should be run daily via Vercel cron or similar
 *
 * Headers required:
 * - Authorization: Bearer <CRON_SECRET>
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Find sessions happening tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get sessions scheduled for tomorrow
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('seminar_sessions')
      .select(`
        id,
        seminar_id,
        session_number,
        session_date,
        session_time_start,
        session_time_end,
        topic,
        seminars (
          id,
          title,
          venue,
          address
        )
      `)
      .eq('session_date', tomorrowStr);

    if (sessionsError) {
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No sessions scheduled for tomorrow',
        remindersSent: 0,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let remindersSent = 0;
    const errors: string[] = [];

    // For each session, find active registrations and send reminders
    for (const session of sessions) {
      const seminarData = session.seminars;
      const seminar = (Array.isArray(seminarData) ? seminarData[0] : seminarData) as {
        id: string;
        title: string;
        venue: string;
        address: string;
      } | null;

      if (!seminar) {
        errors.push(`Session ${session.id} has no associated seminar`);
        continue;
      }

      // Get active registrations for this seminar
      const { data: registrations, error: regError } = await supabaseAdmin
        .from('seminar_registrations')
        .select(`
          id,
          user_id,
          qr_code,
          qr_code_url,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('seminar_id', session.seminar_id)
        .eq('status', 'active');

      if (regError) {
        errors.push(`Error fetching registrations for session ${session.id}: ${regError.message}`);
        continue;
      }

      if (!registrations || registrations.length === 0) {
        continue;
      }

      // Check which registrations have NOT already attended this session
      const { data: attendance } = await supabaseAdmin
        .from('seminar_attendance')
        .select('registration_id')
        .eq('session_id', session.id);

      const attendedRegistrationIds = new Set(
        attendance?.map(a => a.registration_id) || []
      );

      // Send reminders to those who haven't attended yet
      for (const registration of registrations) {
        // Skip if already attended this session
        if (attendedRegistrationIds.has(registration.id)) {
          continue;
        }

        const userData = registration.users;
        const user = (Array.isArray(userData) ? userData[0] : userData) as {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
        } | null;

        if (!user?.email) {
          continue;
        }

        // Format session time
        const sessionTime = session.session_time_start && session.session_time_end
          ? `${formatTime(session.session_time_start)} - ${formatTime(session.session_time_end)}`
          : 'See schedule for time';

        try {
          const result = await sendSessionReminderEmail(user.email, {
            attendeeName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Member',
            seminarTitle: seminar.title,
            sessionNumber: session.session_number,
            sessionDate: new Date(session.session_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            sessionTime,
            sessionTopic: session.topic || undefined,
            venue: seminar.venue || 'GPS Dental Training',
            address: seminar.address || '3700 Crestwood Pkwy NW, Suite 640, Duluth, GA 30096',
            qrCodeUrl: registration.qr_code_url || '',
            qrCode: registration.qr_code || '',
          });

          if (result.success) {
            remindersSent++;
          } else {
            errors.push(`Failed to send to ${user.email}: ${result.error}`);
          }
        } catch (emailError) {
          errors.push(`Error sending to ${user.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Session reminders processed`,
      sessionsFound: sessions.length,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in session reminders cron:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Format time string (HH:MM:SS) to readable format
 */
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
