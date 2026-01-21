import type { APIRoute } from 'astro';
import {
  getTicketByCode,
  createAttendance,
  isTicketCheckedIn,
  updateTicketStatus,
  awardCECredits,
  getEventById,
} from '../../../../lib/supabase/queries';
import { validateScannedQRCode } from '../../../../lib/qrcode/generator';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ticketCode, qrData, checkInMethod = 'manual', checkedInBy, notes } = body;

    // Validate input
    if (!ticketCode && !qrData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ticket code or QR data is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let code = ticketCode;

    // If QR data provided, validate and extract ticket code
    if (qrData) {
      const validation = validateScannedQRCode(qrData);

      if (!validation.valid || !validation.data) {
        return new Response(JSON.stringify({
          success: false,
          error: validation.error || 'Invalid QR code',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      code = validation.data.ticket_code;
    }

    // Get ticket by code
    const ticketResult = await getTicketByCode(code);

    if (!ticketResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ticket not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ticket = ticketResult;

    // Check ticket status
    if (ticket.status === 'cancelled') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This ticket has been cancelled',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (ticket.status === 'used') {
      // Check if already checked in
      const alreadyCheckedIn = await isTicketCheckedIn(ticket.id);

      if (alreadyCheckedIn) {
        return new Response(JSON.stringify({
          success: false,
          error: 'This ticket has already been used for check-in',
          alreadyCheckedIn: true,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Get event details for CE credits
    const event = await getEventById(ticket.event_id);

    if (!event) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create attendance record
    const attendance = await createAttendance({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      user_id: ticket.user_id || undefined,
      check_in_method: checkInMethod,
      checked_in_by: checkedInBy || undefined,
      notes: notes || undefined,
    });

    // Update ticket status to 'used'
    await updateTicketStatus(ticket.id, 'used');

    // Award CE credits if event has credits and user is linked
    let creditsAwarded = 0;

    if (event.ce_credits > 0 && ticket.user_id) {
      await awardCECredits({
        user_id: ticket.user_id,
        event_id: event.id,
        credits: event.ce_credits,
        source: 'course_attendance',
        notes: `Attendance at ${event.title}`,
      });
      creditsAwarded = event.ce_credits;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Check-in successful',
      data: {
        attendanceId: attendance.id,
        ticketCode: ticket.ticket_code,
        attendeeName: ticket.attendee_name,
        attendeeEmail: ticket.attendee_email,
        eventTitle: event.title,
        creditsAwarded,
        checkedInAt: attendance.checked_in_at,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing check-in:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process check-in',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
