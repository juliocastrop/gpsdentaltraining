import type { APIRoute } from 'astro';
import {
  getCertificateByCode,
  getEventById,
} from '../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import {
  generateCourseCertificatePDF,
  generateSeminarCertificatePDF,
  formatSeminarPeriod,
} from '../../../../lib/certificates/generator';

/**
 * GET /api/certificates/[code]/download
 * Download certificate PDF by certificate code
 * Generates PDF on-the-fly if not cached
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { code } = params;

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate code is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get certificate by code
    const certificate = await getCertificateByCode(code);
    if (!certificate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificate not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If PDF already exists, redirect to it
    if (certificate.pdf_url) {
      return Response.redirect(certificate.pdf_url, 302);
    }

    // Generate PDF on-the-fly
    const isSeminar = certificate.certificate_code?.startsWith('GPS-SEM-');

    let pdfBuffer: Buffer;
    let filename: string;

    if (isSeminar) {
      // Parse seminar data from certificate code (format: GPS-SEM-YYYY-...)
      const codeMatch = certificate.certificate_code?.match(/GPS-SEM-(\d{4})/);
      const year = codeMatch ? parseInt(codeMatch[1], 10) : new Date().getFullYear();

      // Determine period based on generation date
      const generatedDate = new Date(certificate.generated_at);
      const period = generatedDate.getMonth() < 6 ? 'first_half' : 'second_half';

      // Default credits for seminar (will be recalculated from attendance)
      const credits = 0;

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

      filename = `GPS_Seminar_Certificate_${certificate.attendee_name.replace(/\s+/g, '_')}.pdf`;
    } else {
      // Get event details
      const event = certificate.event || await getEventById(certificate.event_id);
      if (!event) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Event not found',
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

      filename = `GPS_Course_Certificate_${certificate.attendee_name.replace(/\s+/g, '_')}.pdf`;
    }

    // Return PDF as download
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error downloading certificate:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download certificate',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
