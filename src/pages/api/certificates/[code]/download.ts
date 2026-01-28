import type { APIRoute } from 'astro';
import {
  getCertificateByCode,
  getEventById,
  getDefaultCertificateTemplate,
} from '../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import {
  generateCourseCertificateWithTemplate,
  generateSeminarCertificateWithTemplate,
  formatSeminarPeriod,
} from '../../../../lib/certificates/TemplateBasedGenerator';

/**
 * GET /api/certificates/[code]/download
 * Download certificate PDF by certificate code
 * Generates PDF on-the-fly using configurable templates
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

    // Determine certificate type
    const isSeminar = certificate.certificate_code?.startsWith('GPS-SEM-');
    const certificateType = isSeminar ? 'seminar' : 'course';

    // Get default template for this certificate type
    const template = await getDefaultCertificateTemplate(certificateType);
    if (!template) {
      return new Response(JSON.stringify({
        success: false,
        error: `No default template found for ${certificateType} certificates`,
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let pdfBuffer: Buffer;
    let filename: string;

    if (isSeminar) {
      // Parse seminar data from certificate code (format: GPS-SEM-YYH1-XXXXXX or GPS-SEM-YYH2-XXXXXX)
      const codeMatch = certificate.certificate_code?.match(/GPS-SEM-(\d{2})(H[12])/);
      const year = codeMatch ? 2000 + parseInt(codeMatch[1], 10) : new Date().getFullYear();
      const period: 'first_half' | 'second_half' = codeMatch?.[2] === 'H2' ? 'second_half' : 'first_half';

      // Get credits from attendance records
      const { data: attendanceData } = await supabaseAdmin
        .from('seminar_attendance')
        .select('credits_awarded')
        .eq('user_id', certificate.user_id)
        .eq('seminar_id', certificate.event_id);

      const credits = attendanceData?.reduce((sum, att) => sum + (att.credits_awarded || 0), 0) || 0;

      // Get attendance count
      const { count: sessionsAttended } = await supabaseAdmin
        .from('seminar_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', certificate.user_id)
        .eq('seminar_id', certificate.event_id);

      pdfBuffer = await generateSeminarCertificateWithTemplate(
        {
          attendeeName: certificate.attendee_name,
          programPeriod: formatSeminarPeriod(period, year),
          sessionsAttended: sessionsAttended || 0,
          totalSessions: 10,
          creditsEarned: credits,
          issueDate: certificate.generated_at || new Date().toISOString(),
          certificateCode: certificate.certificate_code,
          venue: template.location_value || undefined,
          courseMethod: template.course_method_value || 'In Person / Live',
        },
        template
      );

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

      // Format event date
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : null;

      let formattedDate: string;
      if (endDate && endDate.getTime() !== startDate.getTime()) {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };
        formattedDate = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.toLocaleDateString('en-US', yearOptions)}`;
      } else {
        formattedDate = startDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      pdfBuffer = await generateCourseCertificateWithTemplate(
        {
          attendeeName: certificate.attendee_name,
          eventTitle: event.title,
          eventSubtitle: event.excerpt ?? undefined, // Use excerpt as subtitle
          eventDate: formattedDate,
          eventEndDate: event.end_date ?? undefined,
          venue: event.venue ?? template.location_value ?? undefined,
          address: event.address ?? undefined,
          ceCredits: event.ce_credits ?? undefined,
          certificateCode: certificate.certificate_code,
          courseMethod: template.course_method_value || 'In Person',
          instructor: template.instructor_name || undefined,
        },
        template
      );

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
