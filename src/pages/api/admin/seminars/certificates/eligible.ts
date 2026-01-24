import type { APIRoute } from 'astro';
import { getEligibleForSeminarCertificates, getActiveSeminars } from '../../../../../lib/supabase/queries';

/**
 * GET /api/admin/seminars/certificates/eligible
 * Get registrations eligible for bi-annual certificates
 *
 * Query params:
 *   seminarId: string - Required seminar ID
 *   period: 'first_half' | 'second_half' - Required period
 *   year: number - Optional, defaults to current year
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const seminarId = url.searchParams.get('seminarId');
    const period = url.searchParams.get('period') as 'first_half' | 'second_half';
    const yearParam = url.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (!seminarId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!period || !['first_half', 'second_half'].includes(period)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Period must be "first_half" or "second_half"',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const eligible = await getEligibleForSeminarCertificates(seminarId, period, year);

    // Format period display name
    const periodDisplay = period === 'first_half'
      ? `January - June ${year}`
      : `July - December ${year}`;

    return new Response(JSON.stringify({
      success: true,
      data: {
        period: period,
        period_display: periodDisplay,
        year: year,
        seminar_id: seminarId,
        eligible_count: eligible.length,
        eligible: eligible.map(item => ({
          registration_id: item.registration.id,
          user_id: item.user?.id,
          attendee_name: `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim(),
          email: item.user?.email,
          credits_earned: item.credits_earned,
          sessions_attended: item.sessions_in_period,
          seminar_title: item.seminar?.title,
        })),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching eligible registrations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch eligible registrations',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
