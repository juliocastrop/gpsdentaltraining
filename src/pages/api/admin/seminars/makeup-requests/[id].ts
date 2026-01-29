import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase/client';

/**
 * GET /api/admin/seminars/makeup-requests/[id]
 * Get a single makeup request by ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request ID required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: request, error } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .select(`
        id,
        reason,
        notes,
        status,
        denial_reason,
        reviewed_at,
        created_at,
        updated_at,
        registration:seminar_registrations(
          id,
          sessions_completed,
          sessions_remaining,
          makeup_used,
          user:users(id, first_name, last_name, email, phone)
        ),
        seminar:seminars(id, title, year),
        missed_session:seminar_sessions!missed_session_id(id, session_number, session_date, topic),
        requested_session:seminar_sessions!requested_session_id(id, session_number, session_date, topic),
        reviewed_by_user:users!reviewed_by(id, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error || !request) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Makeup request not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: request,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching makeup request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch makeup request',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PATCH /api/admin/seminars/makeup-requests/[id]
 * Update a makeup request (approve, deny, update notes, etc.)
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request ID required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { action, notes, denial_reason, requested_session_id, admin_user_id } = body;

    // Get current request
    const { data: currentRequest, error: fetchError } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .select('id, status, registration_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentRequest) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Makeup request not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build update object based on action
    const updates: Record<string, any> = {};

    switch (action) {
      case 'approve':
        if (currentRequest.status !== 'pending') {
          return new Response(JSON.stringify({
            success: false,
            error: `Cannot approve request with status: ${currentRequest.status}`,
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        updates.status = 'approved';
        updates.reviewed_at = new Date().toISOString();
        if (admin_user_id) updates.reviewed_by = admin_user_id;
        if (notes) updates.notes = notes;
        if (requested_session_id) updates.requested_session_id = requested_session_id;
        break;

      case 'deny':
        if (currentRequest.status !== 'pending') {
          return new Response(JSON.stringify({
            success: false,
            error: `Cannot deny request with status: ${currentRequest.status}`,
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        updates.status = 'denied';
        updates.reviewed_at = new Date().toISOString();
        if (admin_user_id) updates.reviewed_by = admin_user_id;
        if (denial_reason) updates.denial_reason = denial_reason;
        if (notes) updates.notes = notes;
        break;

      case 'complete':
        if (currentRequest.status !== 'approved') {
          return new Response(JSON.stringify({
            success: false,
            error: `Cannot complete request with status: ${currentRequest.status}. Must be approved first.`,
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        updates.status = 'completed';

        // Also mark the registration as makeup_used
        const { error: regUpdateError } = await supabaseAdmin
          .from('seminar_registrations')
          .update({ makeup_used: true })
          .eq('id', currentRequest.registration_id);

        if (regUpdateError) {
          console.error('Error updating registration makeup_used:', regUpdateError);
          // Don't fail the whole request, but log it
        }
        break;

      case 'cancel':
        if (!['pending', 'approved'].includes(currentRequest.status)) {
          return new Response(JSON.stringify({
            success: false,
            error: `Cannot cancel request with status: ${currentRequest.status}`,
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        updates.status = 'cancelled';
        break;

      case 'expire':
        if (currentRequest.status !== 'approved') {
          return new Response(JSON.stringify({
            success: false,
            error: `Cannot expire request with status: ${currentRequest.status}`,
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        updates.status = 'expired';
        break;

      case 'update':
        // Just update notes or requested_session_id
        if (notes !== undefined) updates.notes = notes;
        if (requested_session_id !== undefined) updates.requested_session_id = requested_session_id;
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid action: ${action}. Valid actions: approve, deny, complete, cancel, expire, update`,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    // Perform the update
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating makeup request:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedRequest,
      message: `Makeup request ${action}d successfully`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating makeup request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update makeup request',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/admin/seminars/makeup-requests/[id]
 * Delete a makeup request (only allowed for pending requests)
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request ID required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check status before deleting
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Makeup request not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['pending', 'cancelled', 'expired'].includes(request.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot delete request with status: ${request.status}. Only pending, cancelled, or expired requests can be deleted.`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('seminar_makeup_requests')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting makeup request:', deleteError);
      throw deleteError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Makeup request deleted successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting makeup request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete makeup request',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
