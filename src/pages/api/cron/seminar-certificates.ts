import type { APIRoute } from 'astro';
import {
  getActiveSeminars,
  getEligibleForSeminarCertificates,
  createSeminarCertificate,
} from '../../../lib/supabase/queries';

/**
 * POST /api/cron/seminar-certificates
 * Cron job to generate bi-annual seminar certificates
 * Should be called on June 30 and December 31
 *
 * This endpoint can be triggered by:
 * - Vercel Cron Jobs
 * - External cron service
 * - Manual trigger from admin
 *
 * Query params:
 *   key: string - API key for authentication (required in production)
 *   period?: 'first_half' | 'second_half' - Override period (auto-detected if not provided)
 *   year?: number - Override year (defaults to current)
 *   dry_run?: boolean - If true, don't actually create certificates
 */
export const POST: APIRoute = async ({ url, request }) => {
  try {
    // Verify cron secret in production
    const cronSecret = import.meta.env.CRON_SECRET;
    const providedKey = url.searchParams.get('key');

    if (cronSecret && providedKey !== cronSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine period based on current date or override
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const periodParam = url.searchParams.get('period') as 'first_half' | 'second_half' | null;
    const yearParam = url.searchParams.get('year');
    const dryRun = url.searchParams.get('dry_run') === 'true';

    // Auto-detect period: June = first_half end, December = second_half end
    let period: 'first_half' | 'second_half';
    if (periodParam) {
      period = periodParam;
    } else if (month <= 5) {
      // January - June: Generate for first_half
      period = 'first_half';
    } else {
      // July - December: Generate for second_half
      period = 'second_half';
    }

    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    console.log(`[Seminar Certificates Cron] Starting generation for ${period} ${year}${dryRun ? ' (DRY RUN)' : ''}`);

    // Get all active seminars
    const seminars = await getActiveSeminars();

    const results = {
      period,
      year,
      dry_run: dryRun,
      seminars_processed: 0,
      total_generated: 0,
      details: [] as any[],
    };

    for (const seminar of seminars) {
      try {
        // Get eligible registrations for this seminar
        const eligible = await getEligibleForSeminarCertificates(seminar.id, period, year);

        if (eligible.length === 0) {
          results.details.push({
            seminar_id: seminar.id,
            seminar_title: seminar.title,
            eligible_count: 0,
            generated_count: 0,
            message: 'No eligible registrations',
          });
          continue;
        }

        results.seminars_processed++;
        let generatedCount = 0;
        const errors: string[] = [];

        if (!dryRun) {
          // Generate certificates
          for (const item of eligible) {
            try {
              const attendeeName = `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim();

              await createSeminarCertificate({
                user_id: item.user?.id || item.registration.user_id,
                seminar_id: seminar.id,
                attendee_name: attendeeName || 'Unknown',
                credits: item.credits_earned,
                period: period,
                year: year,
              });

              generatedCount++;
              results.total_generated++;

              // TODO: Send email notification
              // await sendSeminarCertificateEmail(item.user?.email, {...});

            } catch (err) {
              console.error(`Error generating certificate for registration ${item.registration.id}:`, err);
              errors.push(`Registration ${item.registration.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        } else {
          // Dry run - just count
          generatedCount = eligible.length;
          results.total_generated += eligible.length;
        }

        results.details.push({
          seminar_id: seminar.id,
          seminar_title: seminar.title,
          eligible_count: eligible.length,
          generated_count: generatedCount,
          errors: errors.length > 0 ? errors : undefined,
        });

      } catch (err) {
        console.error(`Error processing seminar ${seminar.id}:`, err);
        results.details.push({
          seminar_id: seminar.id,
          seminar_title: seminar.title,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const periodDisplay = period === 'first_half'
      ? `January - June ${year}`
      : `July - December ${year}`;

    console.log(`[Seminar Certificates Cron] Completed: ${results.total_generated} certificates for ${periodDisplay}`);

    return new Response(JSON.stringify({
      success: true,
      message: `${dryRun ? '[DRY RUN] Would generate' : 'Generated'} ${results.total_generated} certificates for ${periodDisplay}`,
      data: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in seminar certificates cron:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process seminar certificates',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Also allow GET for easy testing
export const GET: APIRoute = async (context) => {
  return POST(context);
};
