/**
 * Admin Ticket Types API - Update/Delete
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Ticket type ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (body.event_id !== undefined) updateData.event_id = body.event_id;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.ticket_type !== undefined) updateData.ticket_type = body.ticket_type;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.quantity !== undefined) updateData.quantity = body.quantity ? parseInt(body.quantity) : null;
    if (body.sale_start !== undefined) updateData.sale_start = body.sale_start || null;
    if (body.sale_end !== undefined) updateData.sale_end = body.sale_end || null;
    if (body.features !== undefined) updateData.features = body.features || null;
    if (body.manual_sold_out !== undefined) updateData.manual_sold_out = body.manual_sold_out;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.internal_label !== undefined) updateData.internal_label = body.internal_label;

    const { data, error } = await supabaseAdmin
      .from('ticket_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket type:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update ticket type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ticket types PUT error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Ticket type ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if any tickets exist for this type
    const { count } = await supabaseAdmin
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type_id', id);

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete ticket type with existing tickets' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdmin
      .from('ticket_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ticket type:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete ticket type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ticket types DELETE error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
