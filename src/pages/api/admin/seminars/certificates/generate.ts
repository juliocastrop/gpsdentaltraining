import type { APIRoute } from 'astro';
import {
  getEligibleForSeminarCertificates,
  createSeminarCertificate,
  getSeminarBySlug,
} from '../../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

/**
 * POST /api/admin/seminars/certificates/generate
 * Generate bi-annual certificates for eligible seminar participants
 *
 * Body: {
 *   seminarId: string,
 *   period: 'first_half' | 'second_half',
 *   year?: number,
 *   registrationIds?: string[] // Optional: only generate for specific registrations
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { seminarId, period, year: yearParam, registrationIds } = body;

    const year = yearParam || new Date().getFullYear();

    // Validate inputs
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

    // Get eligible registrations
    let eligible = await getEligibleForSeminarCertificates(seminarId, period, year);

    // Filter to specific registrations if provided
    if (registrationIds && registrationIds.length > 0) {
      eligible = eligible.filter(item =>
        registrationIds.includes(item.registration.id)
      );
    }

    if (eligible.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No eligible registrations found',
        data: {
          generated: [],
          count: 0,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate certificates
    const generated = [];
    const errors = [];

    for (const item of eligible) {
      try {
        const attendeeName = `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim();

        const certificate = await createSeminarCertificate({
          user_id: item.user?.id || item.registration.user_id,
          seminar_id: seminarId,
          attendee_name: attendeeName || 'Unknown',
          credits: item.credits_earned,
          period: period,
          year: year,
        });

        generated.push({
          certificate_id: certificate.id,
          certificate_code: certificate.certificate_code,
          registration_id: item.registration.id,
          attendee_name: attendeeName,
          email: item.user?.email,
          credits: item.credits_earned,
        });
      } catch (err) {
        console.error(`Error generating certificate for registration ${item.registration.id}:`, err);
        errors.push({
          registration_id: item.registration.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Format period display name
    const periodDisplay = period === 'first_half'
      ? `January - June ${year}`
      : `July - December ${year}`;

    return new Response(JSON.stringify({
      success: true,
      message: `Generated ${generated.length} certificates for ${periodDisplay}`,
      data: {
        period: period,
        period_display: periodDisplay,
        year: year,
        generated: generated,
        count: generated.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating seminar certificates:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate certificates',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
