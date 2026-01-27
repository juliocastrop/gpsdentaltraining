/**
 * Reports Export API
 * Export attendees, tickets, or CE credits data to CSV
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const GET: APIRoute = async ({ url }) => {
  try {
    const type = url.searchParams.get('type');
    const eventId = url.searchParams.get('event_id');

    if (!type || !['attendees', 'tickets', 'credits'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid export type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let csvContent = '';
    const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;

    switch (type) {
      case 'attendees': {
        // Build query for attendance records
        let query = supabaseAdmin
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            check_in_method,
            ticket:ticket_id(
              ticket_code,
              attendee_name,
              attendee_email,
              status
            ),
            event:event_id(
              title
            )
          `)
          .order('checked_in_at', { ascending: false });

        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data: attendees, error } = await query;

        if (error) throw error;

        // Generate CSV
        const headers = ['Ticket Code', 'Attendee Name', 'Attendee Email', 'Event', 'Check-in Date', 'Check-in Method', 'Status'];
        csvContent = headers.join(',') + '\n';

        for (const row of attendees || []) {
          const ticket = row.ticket as any;
          const event = row.event as any;
          const values = [
            escapeCSV(ticket?.ticket_code || ''),
            escapeCSV(ticket?.attendee_name || ''),
            escapeCSV(ticket?.attendee_email || ''),
            escapeCSV(event?.title || ''),
            escapeCSV(row.checked_in_at || ''),
            escapeCSV(row.check_in_method || ''),
            escapeCSV(ticket?.status || ''),
          ];
          csvContent += values.join(',') + '\n';
        }
        break;
      }

      case 'tickets': {
        // Build query for tickets
        let query = supabaseAdmin
          .from('tickets')
          .select(`
            ticket_code,
            attendee_name,
            attendee_email,
            status,
            created_at,
            event:event_id(title),
            ticket_type:ticket_type_id(name, price)
          `)
          .order('created_at', { ascending: false });

        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data: tickets, error } = await query;

        if (error) throw error;

        // Generate CSV
        const headers = ['Ticket Code', 'Attendee Name', 'Attendee Email', 'Event', 'Ticket Type', 'Price', 'Status', 'Purchase Date'];
        csvContent = headers.join(',') + '\n';

        for (const row of tickets || []) {
          const event = row.event as any;
          const ticketType = row.ticket_type as any;
          const values = [
            escapeCSV(row.ticket_code),
            escapeCSV(row.attendee_name),
            escapeCSV(row.attendee_email),
            escapeCSV(event?.title || ''),
            escapeCSV(ticketType?.name || ''),
            ticketType?.price?.toString() || '0',
            escapeCSV(row.status),
            escapeCSV(row.created_at),
          ];
          csvContent += values.join(',') + '\n';
        }
        break;
      }

      case 'credits': {
        // Build query for CE credits
        let query = supabaseAdmin
          .from('ce_ledger')
          .select(`
            credits,
            source,
            transaction_type,
            notes,
            awarded_at,
            user:user_id(first_name, last_name, email),
            event:event_id(title)
          `)
          .order('awarded_at', { ascending: false });

        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data: credits, error } = await query;

        if (error) throw error;

        // Generate CSV
        const headers = ['Name', 'Email', 'Event', 'Credits', 'Type', 'Source', 'Date', 'Notes'];
        csvContent = headers.join(',') + '\n';

        for (const row of credits || []) {
          const user = row.user as any;
          const event = row.event as any;
          const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
          const values = [
            escapeCSV(fullName),
            escapeCSV(user?.email || ''),
            escapeCSV(event?.title || ''),
            row.credits?.toString() || '0',
            escapeCSV(row.transaction_type),
            escapeCSV(row.source || ''),
            escapeCSV(row.awarded_at),
            escapeCSV(row.notes || ''),
          ];
          csvContent += values.join(',') + '\n';
        }
        break;
      }
    }

    // Return CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
