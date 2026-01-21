import type { APIRoute } from 'astro';
import { getActiveTicketTypes, getTicketStock, isTicketSoldOut } from '../../../../lib/supabase/queries';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { eventId } = params;

    if (!eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ticketTypes = await getActiveTicketTypes(eventId);

    // Enrich with availability info
    const ticketsWithAvailability = await Promise.all(
      ticketTypes.map(async (ticket) => {
        const isSoldOut = await isTicketSoldOut(ticket.id);
        const stock = await getTicketStock(ticket.id);

        return {
          id: ticket.id,
          name: ticket.name,
          ticket_type: ticket.ticket_type,
          price: ticket.price,
          description: ticket.internal_label,
          features: ticket.features,
          sale_start: ticket.sale_start,
          sale_end: ticket.sale_end,
          is_sold_out: isSoldOut,
          is_manual_sold_out: ticket.manual_sold_out,
          stock: {
            total: stock.total,
            sold: stock.sold,
            available: stock.available,
            unlimited: stock.unlimited,
          },
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      tickets: ticketsWithAvailability,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch tickets',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
