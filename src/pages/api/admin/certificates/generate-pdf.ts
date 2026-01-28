import type { APIRoute } from 'astro';
import {
  getCertificateById,
  getEventById,
  updateCertificatePDF,
  getDefaultCertificateTemplate,
} from '../../../../lib/supabase/queries';
import { supabaseAdmin } from '../../../../lib/supabase/client';
import {
  generateCourseCertificateWithTemplate,
  generateSeminarCertificateWithTemplate,
  formatSeminarPeriod,
  generateCertificateFilename,
} from '../../../../lib/certificates/TemplateBasedGenerator';

/**
 * POST /api/admin/certificates/generate-pdf
 * Generate a PDF for an existing certificate record using configurable templates
 *
 * Body: {
 *   certificateId: string,
 *   type?: 'course' | 'seminar', // Auto-detected from certificate code if not provided
 *   templateId?: string, // Optional: specific template to use (otherwise uses default)
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { certificateId, type: typeOverride, templateId } = body;

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

    // Get the template to use
    let template;
    if (templateId) {
      // Use specific template if provided
      const { data, error } = await supabaseAdmin
        .from('certificate_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Template not found',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      template = data;
    } else {
      // Use default template for the certificate type
      template = await getDefaultCertificateTemplate(certificateType);
      if (!template) {
        return new Response(JSON.stringify({
          success: false,
          error: `No default template found for ${certificateType} certificates`,
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

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

      pdfBuffer = await generateSeminarCertificateWithTemplate(
        {
          attendeeName: certificate.attendee_name,
          programPeriod: formatSeminarPeriod(period as 'first_half' | 'second_half', year),
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

      // Format event date
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : null;

      let formattedDate: string;
      if (endDate && endDate.getTime() !== startDate.getTime()) {
        // Multi-day event
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };
        formattedDate = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.toLocaleDateString('en-US', yearOptions)}`;
      } else {
        // Single day event
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
        templateId: template.id,
        templateName: template.name,
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
