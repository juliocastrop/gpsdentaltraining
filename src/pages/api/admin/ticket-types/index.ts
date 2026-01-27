/**
 * Admin Ticket Types API - Create
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      event_id,
      name,
      ticket_type,
      price,
      quantity,
      sale_start,
      sale_end,
      features,
      manual_sold_out,
      status,
      internal_label,
    } = body;

    if (!event_id || !name || !price) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('ticket_types')
      .insert({
        event_id,
        name,
        ticket_type: ticket_type || 'general',
        price: parseFloat(price),
        quantity: quantity ? parseInt(quantity) : null,
        sale_start: sale_start || null,
        sale_end: sale_end || null,
        features: features || null,
        manual_sold_out: manual_sold_out || false,
        status: status || 'active',
        internal_label: internal_label || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket type:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create ticket type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ticket types POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
