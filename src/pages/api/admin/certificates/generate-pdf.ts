import type { APIRoute } from 'astro';
import {
  getCertificateById,
  getEventById,
  updateCertificatePDF,
} from '../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import {
  generateCourseCertificatePDF,
  generateSeminarCertificatePDF,
  formatSeminarPeriod,
  generateCertificateFilename,
} from '../../../../lib/certificates/generator';

/**
 * POST /api/admin/certificates/generate-pdf
 * Generate a PDF for an existing certificate record
 *
 * Body: {
 *   certificateId: string,
 *   type?: 'course' | 'seminar', // Auto-detected from certificate code if not provided
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { certificateId, type: typeOverride } = body;

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
    const isSeminar = typeOverride === 'seminar' ||
      certificate.certificate_code?.startsWith('GPS-SEM-');
    const certificateType = isSeminar ? 'seminar' : 'course';

    let pdfBuffer: Buffer;

    if (certificateType === 'seminar') {
      // Parse seminar certificate data from notes
      // Format: "Seminar Certificate - first_half 2025 - 10 CE Credits"
      const notesMatch = certificate.notes?.match(
        /Seminar Certificate - (\w+) (\d+) - ([\d.]+) CE Credits/
      );

      const period = notesMatch?.[1] || 'first_half';
      const year = parseInt(notesMatch?.[2] || new Date().getFullYear().toString(), 10);
      const credits = parseFloat(notesMatch?.[3] || '0');

      // Get attendance count (sessions attended)
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

    // Upload PDF to Supabase Storage
    const filename = generateCertificateFilename(
      certificateType,
      certificate.attendee_name,
      certificate.certificate_code
    );

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(`pdfs/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload PDF to storage',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(`pdfs/${filename}`);

    const pdfUrl = urlData.publicUrl;

    // Update certificate record with PDF URL
    await updateCertificatePDF(certificateId, pdfUrl);

    return new Response(JSON.stringify({
      success: true,
      message: 'Certificate PDF generated successfully',
      data: {
        certificateId,
        certificateCode: certificate.certificate_code,
        type: certificateType,
        pdfUrl,
        filename,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate certificate PDF',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
