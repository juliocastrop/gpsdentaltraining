import type { APIRoute } from 'astro';
import {
  getCertificateById,
  getEventById,
} from '../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import {
  generateCourseCertificatePDF,
  generateSeminarCertificatePDF,
  formatSeminarPeriod,
} from '../../../../lib/certificates/generator';

/**
 * GET /api/admin/certificates/preview?id={certificateId}
 * Generate and return a PDF preview (not saved to storage)
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const certificateId = url.searchParams.get('id');

    if (!certificateId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get certificate record
    const certificate = await getCertificateById(certificateId);
    if (!certificate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine certificate type
    const isSeminar = certificate.certificate_code?.startsWith('GPS-SEM-');

    let pdfBuffer: Buffer;

    if (isSeminar) {
      // Parse seminar certificate data from notes
      const notesMatch = certificate.notes?.match(
        /Seminar Certificate - (\w+) (\d+) - ([\d.]+) CE Credits/
      );

      const period = notesMatch?.[1] || 'first_half';
      const year = parseInt(notesMatch?.[2] || new Date().getFullYear().toString(), 10);
      const credits = parseFloat(notesMatch?.[3] || '0');

      // Get attendance count
      const { count: sessionsAttended } = await supabaseAdmin
        .from('seminar_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', certificate.user_id)
        .eq('seminar_id', certificate.event_id);

      pdfBuffer = await generateSeminarCertificatePDF({
        attendeeName: certificate.attendee_name,
        period: formatSeminarPeriod(period as 'first_half' | 'second_half', year),
        year,
        issueDate: certificate.generated_at || new Date().toISOString(),
        creditsEarned: credits,
        sessionsAttended: sessionsAttended || 0,
        certificateCode: certificate.certificate_code,
      });
    } else {
      // Get event details for course certificate
      const event = await getEventById(certificate.event_id);
      if (!event) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Event not found for certificate',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      pdfBuffer = await generateCourseCertificatePDF({
        attendeeName: certificate.attendee_name,
        eventTitle: event.title,
        eventDate: event.start_date,
        eventEndDate: event.end_date ?? undefined,
        venue: event.venue ?? undefined,
        address: event.address ?? undefined,
        ceCredits: event.ce_credits ?? undefined,
        certificateCode: certificate.certificate_code,
        courseMethod: 'In Person',
      });
    }

    // Return PDF directly for preview (inline display)
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="preview-${certificate.certificate_code}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating certificate preview:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
